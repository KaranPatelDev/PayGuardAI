"""PayGuard AI - Main FastAPI application."""
import os
import re
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth_utils import hash_password, verify_password, create_access_token, get_current_user_id
from models import (
    UserRegister, UserLogin, UserPublic, TokenResponse,
    CustomerCreate, CustomerUpdate, Customer,
    InvoiceCreate, InvoiceUpdate, Invoice,
    PaymentCreate, Payment,
    FollowUpCreate, FollowUpUpdate, FollowUp,
    AIFollowupRequest, AIRiskRequest, AIReportRequest,
    SettingsUpdate, utcnow_iso, new_id,
)
from ai_service import (
    generate_followup_ai, compute_risk_score, build_recovery_report, _format_inr,
    parse_invoice_file,
)
from seed import seed_demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("payguard")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="PayGuard AI")
api = APIRouter(prefix="/api")


# ============== HELPERS ==============
def _today():
    return datetime.now(timezone.utc).date()


def _parse_date(s: str):
    return datetime.fromisoformat(s).date() if s else None


def _calc_invoice_status(due_date: str, pending_amount: float, total_amount: float, current_status: Optional[str] = None) -> str:
    """Auto-detect status based on dates + payments. Preserves manual states like Disputed/Escalated/Draft."""
    if current_status in ("Disputed", "Escalated", "Draft"):
        return current_status
    if pending_amount <= 0 and total_amount > 0:
        return "Paid"
    if 0 < pending_amount < total_amount:
        return "Partially Paid"
    try:
        due = datetime.fromisoformat(due_date).date()
    except Exception:
        return current_status or "Sent"
    today = _today()
    if due < today:
        return "Overdue"
    if due == today:
        return "Due Today"
    if (due - today).days <= 3:
        return "Due Soon"
    return "Sent"


def _overdue_days(due_date: str) -> int:
    try:
        due = datetime.fromisoformat(due_date).date()
        return (_today() - due).days
    except Exception:
        return 0


def _count_broken_promises(followups: list, invoices: list) -> int:
    """Count follow-ups where a payment promise was made but the invoice is still pending past the promised date."""
    today = _today()
    broken = 0
    for f in followups:
        pd = f.get("promised_payment_date")
        if f.get("status") == "Promise Received" and pd:
            try:
                if datetime.fromisoformat(pd).date() < today:
                    inv = next((i for i in invoices if i["id"] == f["invoice_id"]), None)
                    if inv and inv.get("pending_amount", 0) > 0:
                        broken += 1
            except Exception:
                pass
    return broken


def _compute_invoice_stats(invoices: list) -> dict:
    """Compute aggregate stats from a list of invoice documents."""
    pending = sum(i.get("pending_amount", 0) for i in invoices)
    overdue_invoices = [i for i in invoices if i.get("pending_amount", 0) > 0 and _overdue_days(i.get("due_date", "")) > 0]
    overdue_count = len(overdue_invoices)
    avg_delay = (
        int(sum(_overdue_days(i.get("due_date", "")) for i in overdue_invoices) / overdue_count)
        if overdue_count else 0
    )
    return {"pending": pending, "overdue_count": overdue_count, "avg_delay": avg_delay}


async def _refresh_customer_risk(user_id: str, customer_id: str):
    """Recompute and persist customer risk based on invoices + followups."""
    invoices = await db.invoices.find({"user_id": user_id, "customer_id": customer_id}, {"_id": 0}).to_list(1000)
    followups = await db.followups.find({"user_id": user_id, "customer_id": customer_id}, {"_id": 0}).to_list(1000)
    customer = await db.customers.find_one({"id": customer_id, "user_id": user_id}, {"_id": 0})
    if not customer:
        return

    stats = _compute_invoice_stats(invoices)
    broken_promises = _count_broken_promises(followups, invoices)
    ignored = sum(1 for f in followups if f.get("status") == "Ignored")
    disputed = sum(1 for i in invoices if i.get("status") == "Disputed")

    risk = compute_risk_score({
        "total_pending": stats["pending"],
        "overdue_invoice_count": stats["overdue_count"],
        "avg_delay_days": stats["avg_delay"],
        "broken_promises": broken_promises,
        "ignored_followups": ignored,
        "disputed_count": disputed,
        "credit_limit": customer.get("credit_limit", 0),
    })

    await db.customers.update_one(
        {"id": customer_id, "user_id": user_id},
        {"$set": {**risk, "updated_at": utcnow_iso()}},
    )
    return {**risk, "broken_promises": broken_promises, "total_pending": stats["pending"]}


async def _user_to_public(user_doc: dict) -> dict:
    return {
        "id": user_doc["id"],
        "full_name": user_doc["full_name"],
        "email": user_doc["email"],
        "phone": user_doc.get("phone", ""),
        "business_name": user_doc["business_name"],
        "business_type": user_doc.get("business_type", ""),
        "gst_number": user_doc.get("gst_number", ""),
        "created_at": user_doc["created_at"],
        "updated_at": user_doc["updated_at"],
    }


# ============== AUTH ==============
@api.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    now = utcnow_iso()
    user_id = new_id()
    user = {
        "id": user_id,
        "full_name": payload.full_name,
        "email": payload.email.lower(),
        "phone": payload.phone or "",
        "business_name": payload.business_name,
        "business_type": payload.business_type or "",
        "gst_number": payload.gst_number or "",
        "password_hash": hash_password(payload.password),
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user)
    # default settings
    await db.settings.insert_one({
        "user_id": user_id,
        "default_payment_terms": 30,
        "default_followup_tone": "Professional",
        "default_reminder_days": [-3, 0, 3, 7, 15, 30],
        "reminder_channels": ["WhatsApp", "Email"],
        "currency": "INR",
        "ai_provider": "claude-sonnet-4-6",
        "updated_at": now,
    })
    token = create_access_token(user_id)
    return {"access_token": token, "token_type": "bearer", "user": await _user_to_public(user)}


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"])
    return {"access_token": token, "token_type": "bearer", "user": await _user_to_public(user)}


@api.get("/auth/me", response_model=UserPublic)
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return await _user_to_public(user)


# ============== CUSTOMERS ==============
@api.get("/customers")
async def list_customers(
    user_id: str = Depends(get_current_user_id),
    search: Optional[str] = None,
    risk: Optional[str] = None,
):
    query = {"user_id": user_id}
    if search:
        query["business_name"] = {"$regex": search, "$options": "i"}
    if risk and risk != "All":
        query["risk_category"] = risk
    items = await db.customers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # attach quick stats
    for c in items:
        invs = await db.invoices.find({"user_id": user_id, "customer_id": c["id"]}, {"_id": 0}).to_list(1000)
        c["total_invoiced"] = sum(i.get("total_amount", 0) for i in invs)
        c["total_pending"] = sum(i.get("pending_amount", 0) for i in invs)
        c["invoice_count"] = len(invs)
    return items


@api.post("/customers")
async def create_customer(payload: CustomerCreate, user_id: str = Depends(get_current_user_id)):
    now = utcnow_iso()
    doc = {
        "id": new_id(), "user_id": user_id, **payload.model_dump(),
        "risk_score": 0, "risk_category": "Low Risk",
        "risk_reason": "New customer, no payment history yet.",
        "risk_action": "Maintain standard credit terms and monitor first transactions.",
        "created_at": now, "updated_at": now,
    }
    await db.customers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/customers/{cid}")
async def get_customer(cid: str, user_id: str = Depends(get_current_user_id)):
    c = await db.customers.find_one({"id": cid, "user_id": user_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    invoices = await db.invoices.find({"user_id": user_id, "customer_id": cid}, {"_id": 0}).sort("invoice_date", -1).to_list(1000)
    payments = await db.payments.find({"user_id": user_id, "customer_id": cid}, {"_id": 0}).sort("payment_date", -1).to_list(1000)
    followups = await db.followups.find({"user_id": user_id, "customer_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    c["invoices"] = invoices
    c["payments"] = payments
    c["followups"] = followups
    c["total_pending"] = sum(i.get("pending_amount", 0) for i in invoices)
    c["total_invoiced"] = sum(i.get("total_amount", 0) for i in invoices)
    return c


@api.put("/customers/{cid}")
async def update_customer(cid: str, payload: CustomerUpdate, user_id: str = Depends(get_current_user_id)):
    existing = await db.customers.find_one({"id": cid, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    await db.customers.update_one({"id": cid, "user_id": user_id}, {"$set": updates})
    return await db.customers.find_one({"id": cid, "user_id": user_id}, {"_id": 0})


@api.delete("/customers/{cid}")
async def delete_customer(cid: str, user_id: str = Depends(get_current_user_id)):
    res = await db.customers.delete_one({"id": cid, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    # cascade
    await db.invoices.delete_many({"user_id": user_id, "customer_id": cid})
    await db.payments.delete_many({"user_id": user_id, "customer_id": cid})
    await db.followups.delete_many({"user_id": user_id, "customer_id": cid})
    return {"ok": True}


@api.get("/customers/{cid}/risk")
async def customer_risk(cid: str, user_id: str = Depends(get_current_user_id)):
    c = await db.customers.find_one({"id": cid, "user_id": user_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    risk = await _refresh_customer_risk(user_id, cid)
    return risk or {"risk_score": 0, "risk_category": "Low Risk"}


# ============== INVOICES ==============
def _build_invoice_query(user_id: str, status_filter: Optional[str], customer_id: Optional[str], search: Optional[str]) -> dict:
    """Build a MongoDB query dict for listing invoices."""
    query = {"user_id": user_id}
    if status_filter and status_filter != "All":
        query["status"] = status_filter
    if customer_id:
        query["customer_id"] = customer_id
    if search:
        query["invoice_number"] = {"$regex": search, "$options": "i"}
    return query


def _enrich_invoices_with_customer(invoices: list, customer_map: dict) -> None:
    """Add customer_name, customer_risk, overdue_days, and auto-update status on each invoice."""
    for inv in invoices:
        new_status = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
        if new_status != inv.get("status"):
            inv["status"] = new_status
        inv["overdue_days"] = max(0, _overdue_days(inv["due_date"])) if inv.get("pending_amount", 0) > 0 else 0
        c = customer_map.get(inv["customer_id"])
        inv["customer_name"] = c["business_name"] if c else ""
        inv["customer_risk"] = c.get("risk_category", "Low Risk") if c else "Low Risk"


@api.get("/invoices")
async def list_invoices(
    user_id: str = Depends(get_current_user_id),
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_id: Optional[str] = None,
    search: Optional[str] = None,
):
    query = _build_invoice_query(user_id, status_filter, customer_id, search)
    items = await db.invoices.find(query, {"_id": 0}).sort("due_date", 1).to_list(2000)

    cust_ids = list({i["customer_id"] for i in items})
    customer_map = {}
    if cust_ids:
        custs = await db.customers.find({"id": {"$in": cust_ids}, "user_id": user_id}, {"_id": 0}).to_list(1000)
        customer_map = {c["id"]: c for c in custs}

    _enrich_invoices_with_customer(items, customer_map)

    # Persist any auto-updated statuses
    for inv in items:
        if inv.get("status") != inv.get("_original_status"):
            await db.invoices.update_one({"id": inv["id"], "user_id": user_id}, {"$set": {"status": inv["status"], "updated_at": utcnow_iso()}})

    return items


@api.post("/invoices")
async def create_invoice(payload: InvoiceCreate, user_id: str = Depends(get_current_user_id)):
    cust = await db.customers.find_one({"id": payload.customer_id, "user_id": user_id}, {"_id": 0})
    if not cust:
        raise HTTPException(status_code=400, detail="Customer not found")
    total = payload.amount + payload.tax_amount
    now = utcnow_iso()
    inv_status = _calc_invoice_status(payload.due_date, total, total, None)
    doc = {
        "id": new_id(), "user_id": user_id,
        **payload.model_dump(),
        "total_amount": total, "paid_amount": 0, "pending_amount": total,
        "status": inv_status, "file_url": "",
        "created_at": now, "updated_at": now,
    }
    await db.invoices.insert_one(doc)
    await _refresh_customer_risk(user_id, payload.customer_id)
    doc.pop("_id", None)
    return doc


@api.get("/invoices/{iid}")
async def get_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    cust = await db.customers.find_one({"id": inv["customer_id"], "user_id": user_id}, {"_id": 0})
    payments = await db.payments.find({"user_id": user_id, "invoice_id": iid}, {"_id": 0}).sort("payment_date", -1).to_list(500)
    followups = await db.followups.find({"user_id": user_id, "invoice_id": iid}, {"_id": 0}).sort("created_at", -1).to_list(500)
    new_status = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
    inv["status"] = new_status
    inv["overdue_days"] = max(0, _overdue_days(inv["due_date"])) if inv.get("pending_amount", 0) > 0 else 0
    inv["customer"] = cust
    inv["payments"] = payments
    inv["followups"] = followups
    return inv


@api.put("/invoices/{iid}")
async def update_invoice(iid: str, payload: InvoiceUpdate, user_id: str = Depends(get_current_user_id)):
    existing = await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "amount" in updates or "tax_amount" in updates:
        amt = updates.get("amount", existing["amount"])
        tax = updates.get("tax_amount", existing["tax_amount"])
        updates["total_amount"] = amt + tax
        updates["pending_amount"] = max(0, updates["total_amount"] - existing.get("paid_amount", 0))
    updates["updated_at"] = utcnow_iso()
    new_doc = {**existing, **updates}
    updates["status"] = _calc_invoice_status(new_doc["due_date"], new_doc.get("pending_amount", 0), new_doc.get("total_amount", 0), updates.get("status") or existing.get("status"))
    await db.invoices.update_one({"id": iid, "user_id": user_id}, {"$set": updates})
    await _refresh_customer_risk(user_id, existing["customer_id"])
    return await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})


@api.delete("/invoices/{iid}")
async def delete_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.invoices.delete_one({"id": iid, "user_id": user_id})
    await db.payments.delete_many({"user_id": user_id, "invoice_id": iid})
    await db.followups.delete_many({"user_id": user_id, "invoice_id": iid})
    await _refresh_customer_risk(user_id, inv["customer_id"])
    return {"ok": True}


@api.post("/invoices/{iid}/mark-paid")
async def mark_paid(iid: str, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    pending = inv.get("pending_amount", 0)
    if pending > 0:
        await db.payments.insert_one({
            "id": new_id(), "invoice_id": iid, "customer_id": inv["customer_id"],
            "user_id": user_id, "amount": pending,
            "payment_date": _today().isoformat(),
            "payment_mode": "Manual", "reference_number": "",
            "notes": "Marked as paid", "created_at": utcnow_iso(),
        })
    await db.invoices.update_one(
        {"id": iid, "user_id": user_id},
        {"$set": {"paid_amount": inv.get("total_amount", 0), "pending_amount": 0, "status": "Paid", "updated_at": utcnow_iso()}},
    )
    await _refresh_customer_risk(user_id, inv["customer_id"])
    return await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})


@api.get("/invoices/{iid}/timeline")
async def invoice_timeline(iid: str, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": iid, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    due = datetime.fromisoformat(inv["due_date"]).date()
    today = _today()
    steps = [
        (-3, "Gentle reminder", "Send a friendly heads-up before the due date."),
        (0, "Due date reminder", "Confirm the payment is being processed."),
        (3, "First overdue reminder", "Politely follow up on the overdue payment."),
        (7, "Strong reminder", "Increase urgency and request a payment commitment."),
        (15, "Call script & escalation", "Make a direct call and consider escalation."),
        (30, "Final warning", "Send final warning and prepare legal action notice."),
    ]
    followups = await db.followups.find({"user_id": user_id, "invoice_id": iid}, {"_id": 0}).to_list(500)
    timeline = []
    for offset, action, desc in steps:
        action_date = due + timedelta(days=offset)
        # match a followup on/near this date
        completed = any(
            abs((datetime.fromisoformat(f["created_at"][:10]).date() - action_date).days) <= 1 and
            f.get("followup_type", "").lower().split()[0] in action.lower()
            for f in followups
        )
        status = "completed" if completed else ("due" if action_date <= today else "upcoming")
        timeline.append({
            "offset_days": offset,
            "action": action,
            "description": desc,
            "date": action_date.isoformat(),
            "status": status,
        })
    return {"invoice_id": iid, "due_date": inv["due_date"], "timeline": timeline}


# ============== PAYMENTS ==============
@api.get("/payments")
async def list_payments(user_id: str = Depends(get_current_user_id)):
    items = await db.payments.find({"user_id": user_id}, {"_id": 0}).sort("payment_date", -1).to_list(2000)
    # enrich
    inv_ids = list({p["invoice_id"] for p in items})
    invs = await db.invoices.find({"id": {"$in": inv_ids}, "user_id": user_id}, {"_id": 0}).to_list(2000) if inv_ids else []
    inv_map = {i["id"]: i for i in invs}
    cust_ids = list({p["customer_id"] for p in items})
    custs = await db.customers.find({"id": {"$in": cust_ids}, "user_id": user_id}, {"_id": 0}).to_list(2000) if cust_ids else []
    cust_map = {c["id"]: c for c in custs}
    for p in items:
        p["invoice_number"] = inv_map.get(p["invoice_id"], {}).get("invoice_number", "")
        p["customer_name"] = cust_map.get(p["customer_id"], {}).get("business_name", "")
    return items


@api.post("/payments")
async def create_payment(payload: PaymentCreate, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": payload.invoice_id, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    doc = {
        "id": new_id(), "user_id": user_id, "customer_id": inv["customer_id"],
        **payload.model_dump(), "created_at": utcnow_iso(),
    }
    await db.payments.insert_one(doc)
    new_paid = inv.get("paid_amount", 0) + payload.amount
    new_pending = max(0, inv.get("total_amount", 0) - new_paid)
    new_status = _calc_invoice_status(inv["due_date"], new_pending, inv.get("total_amount", 0), inv.get("status"))
    await db.invoices.update_one(
        {"id": inv["id"], "user_id": user_id},
        {"$set": {"paid_amount": new_paid, "pending_amount": new_pending, "status": new_status, "updated_at": utcnow_iso()}},
    )
    await _refresh_customer_risk(user_id, inv["customer_id"])
    doc.pop("_id", None)
    return doc


@api.get("/payments/invoice/{iid}")
async def payments_for_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    return await db.payments.find({"user_id": user_id, "invoice_id": iid}, {"_id": 0}).sort("payment_date", -1).to_list(500)


# ============== FOLLOW-UPS ==============
@api.get("/followups")
async def list_followups(user_id: str = Depends(get_current_user_id)):
    items = await db.followups.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items


@api.post("/followups")
async def create_followup(payload: FollowUpCreate, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": payload.invoice_id, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    doc = {
        "id": new_id(), "user_id": user_id, "customer_id": inv["customer_id"],
        **payload.model_dump(), "created_at": utcnow_iso(),
    }
    await db.followups.insert_one(doc)
    await _refresh_customer_risk(user_id, inv["customer_id"])
    doc.pop("_id", None)
    return doc


@api.get("/followups/invoice/{iid}")
async def followups_for_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    return await db.followups.find({"user_id": user_id, "invoice_id": iid}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.put("/followups/{fid}")
async def update_followup(fid: str, payload: FollowUpUpdate, user_id: str = Depends(get_current_user_id)):
    existing = await db.followups.find_one({"id": fid, "user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.followups.update_one({"id": fid, "user_id": user_id}, {"$set": updates})
    await _refresh_customer_risk(user_id, existing["customer_id"])
    return await db.followups.find_one({"id": fid, "user_id": user_id}, {"_id": 0})


# ============== AI ==============
@api.post("/ai/parse-invoice")
async def ai_parse_invoice(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
    """Upload a PDF or image of an invoice; AI extracts fields for pre-filling the form."""
    allowed = {"application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"}
    mime = file.content_type or "application/pdf"
    if mime not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime}. Use PDF, PNG, JPG, or WebP.")
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")
    result = await parse_invoice_file(data, mime)
    if result.get("_error") and not result.get("invoice_number"):
        raise HTTPException(status_code=502, detail=f"OCR failed: {result.get('_error')}")
    # Try to match customer_business_name to an existing customer
    name = (result.get("customer_business_name") or "").strip()
    if name:
        cust = await db.customers.find_one(
            {"user_id": user_id, "business_name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}},
            {"_id": 0},
        )
        if cust:
            result["matched_customer_id"] = cust["id"]
    return result


@api.post("/ai/generate-followup")
async def ai_generate_followup(payload: AIFollowupRequest, user_id: str = Depends(get_current_user_id)):
    inv = await db.invoices.find_one({"id": payload.invoice_id, "user_id": user_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    cust = await db.customers.find_one({"id": inv["customer_id"], "user_id": user_id}, {"_id": 0})
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    prev_count = await db.followups.count_documents({"user_id": user_id, "invoice_id": payload.invoice_id})
    result = await generate_followup_ai(
        customer_name=cust["business_name"] if cust else "Customer",
        invoice_number=inv["invoice_number"],
        amount=inv.get("total_amount", inv["amount"]),
        due_date=inv["due_date"],
        overdue_days=_overdue_days(inv["due_date"]),
        tone=payload.tone,
        message_type=payload.message_type,
        business_name=user.get("business_name", "Your Business") if user else "Your Business",
        previous_followups=prev_count,
        risk_category=cust.get("risk_category", "Low Risk") if cust else "Low Risk",
    )
    return result


@api.post("/ai/generate-risk-summary")
async def ai_risk_summary(payload: AIRiskRequest, user_id: str = Depends(get_current_user_id)):
    cust = await db.customers.find_one({"id": payload.customer_id, "user_id": user_id}, {"_id": 0})
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    risk = await _refresh_customer_risk(user_id, payload.customer_id)
    return {"customer": cust["business_name"], **(risk or {})}


@api.post("/ai/generate-recovery-report")
async def ai_recovery_report(payload: AIReportRequest, user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    biz = user.get("business_name", "Your Business") if user else "Your Business"
    if payload.customer_id:
        cust = await db.customers.find_one({"id": payload.customer_id, "user_id": user_id}, {"_id": 0})
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
        risk = await _refresh_customer_risk(user_id, payload.customer_id) or {}
        invs = await db.invoices.find({"user_id": user_id, "customer_id": payload.customer_id, "pending_amount": {"$gt": 0}}, {"_id": 0}).to_list(500)
        followups = await db.followups.find({"user_id": user_id, "customer_id": payload.customer_id}, {"_id": 0}).to_list(500)
        for i in invs:
            i["overdue_days"] = max(0, _overdue_days(i["due_date"]))
        total_pending = sum(i["pending_amount"] for i in invs)
        report = build_recovery_report(
            customer_name=cust["business_name"],
            invoice_summary=invs,
            risk_info=risk,
            business_name=biz,
            total_pending=total_pending,
            followup_count=len(followups),
            broken_promises=risk.get("broken_promises", 0),
        )
        return {"report": report, "total_pending": total_pending, "risk": risk, "customer": cust}
    elif payload.invoice_id:
        inv = await db.invoices.find_one({"id": payload.invoice_id, "user_id": user_id}, {"_id": 0})
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        cust = await db.customers.find_one({"id": inv["customer_id"], "user_id": user_id}, {"_id": 0})
        risk = await _refresh_customer_risk(user_id, inv["customer_id"]) or {}
        followups = await db.followups.find({"user_id": user_id, "invoice_id": payload.invoice_id}, {"_id": 0}).to_list(500)
        inv["overdue_days"] = max(0, _overdue_days(inv["due_date"]))
        report = build_recovery_report(
            customer_name=cust["business_name"] if cust else "",
            invoice_summary=[inv],
            risk_info=risk,
            business_name=biz,
            total_pending=inv.get("pending_amount", 0),
            followup_count=len(followups),
            broken_promises=risk.get("broken_promises", 0),
        )
        return {"report": report, "invoice": inv, "risk": risk, "customer": cust}
    raise HTTPException(status_code=400, detail="Provide customer_id or invoice_id")


# ============== DASHBOARD ==============
@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    invoices = await db.invoices.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    customers = await db.customers.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    today = _today()

    # refresh statuses inline
    for inv in invoices:
        inv["status"] = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
        inv["overdue_days"] = max(0, _overdue_days(inv["due_date"])) if inv.get("pending_amount", 0) > 0 else 0

    total_invoiced = sum(i.get("total_amount", 0) for i in invoices)
    total_pending = sum(i.get("pending_amount", 0) for i in invoices)
    total_recovered = sum(i.get("paid_amount", 0) for i in invoices)
    overdue_invoices = [i for i in invoices if i.get("pending_amount", 0) > 0 and _overdue_days(i["due_date"]) > 0]
    total_overdue = sum(i.get("pending_amount", 0) for i in overdue_invoices)
    overdue_count = len(overdue_invoices)
    avg_delay = int(sum(_overdue_days(i["due_date"]) for i in overdue_invoices) / overdue_count) if overdue_count else 0

    high_risk_count = sum(1 for c in customers if c.get("risk_category") in ("High Risk", "Critical Risk"))
    collection_pct = round((total_recovered / total_invoiced) * 100, 1) if total_invoiced else 0

    return {
        "total_invoiced": total_invoiced,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "total_recovered": total_recovered,
        "overdue_count": overdue_count,
        "high_risk_count": high_risk_count,
        "avg_delay_days": avg_delay,
        "collection_efficiency": collection_pct,
        "customer_count": len(customers),
        "invoice_count": len(invoices),
    }


@api.get("/dashboard/charts")
async def dashboard_charts(user_id: str = Depends(get_current_user_id)):
    invoices = await db.invoices.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    customers = await db.customers.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    payments = await db.payments.find({"user_id": user_id}, {"_id": 0}).to_list(5000)

    status_dist = _build_status_distribution(invoices)
    risk_dist = _build_risk_distribution(customers)
    monthly_trend = _build_monthly_trend(payments)
    top_overdue_list = _build_top_overdue(invoices, customers)

    total_invoiced = sum(i.get("total_amount", 0) for i in invoices)
    total_recovered = sum(i.get("paid_amount", 0) for i in invoices)
    total_pending = sum(i.get("pending_amount", 0) for i in invoices)

    return {
        "pending_vs_recovered": [
            {"name": "Recovered", "value": total_recovered},
            {"name": "Pending", "value": total_pending},
        ],
        "status_distribution": [{"name": k, "value": v} for k, v in status_dist.items()],
        "risk_distribution": [{"name": k, "value": v} for k, v in risk_dist.items()],
        "monthly_trend": monthly_trend,
        "top_overdue": top_overdue_list,
        "total_invoiced": total_invoiced,
    }


def _build_status_distribution(invoices: list) -> dict:
    """Count invoices by status."""
    status_dist = {}
    for inv in invoices:
        s = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
        status_dist[s] = status_dist.get(s, 0) + 1
    return status_dist


def _build_risk_distribution(customers: list) -> dict:
    """Count customers by risk category."""
    risk_dist = {}
    for c in customers:
        r = c.get("risk_category", "Low Risk")
        risk_dist[r] = risk_dist.get(r, 0) + 1
    return risk_dist


def _build_monthly_trend(payments: list) -> list:
    """Aggregate payment amounts by month for the last 6 months."""
    from collections import defaultdict
    monthly = defaultdict(float)
    today = _today()
    for p in payments:
        try:
            d = datetime.fromisoformat(p["payment_date"]).date()
            if (today.year - d.year) * 12 + (today.month - d.month) < 6:
                key = d.strftime("%b %y")
                monthly[key] += p.get("amount", 0)
        except Exception:
            pass
    months_order = []
    for i in range(5, -1, -1):
        m = today.replace(day=1)
        for _ in range(i):
            prev = m.replace(day=1) - timedelta(days=1)
            m = prev.replace(day=1)
        months_order.append(m.strftime("%b %y"))
    return [{"month": m, "amount": monthly.get(m, 0)} for m in months_order]


def _build_top_overdue(invoices: list, customers: list) -> list:
    """Get top 5 customers by overdue pending amount."""
    cust_map = {c["id"]: c for c in customers}
    overdue_by_cust = {}
    for inv in invoices:
        if inv.get("pending_amount", 0) > 0 and _overdue_days(inv["due_date"]) > 0:
            cid = inv["customer_id"]
            overdue_by_cust[cid] = overdue_by_cust.get(cid, 0) + inv["pending_amount"]
    top_overdue = sorted(overdue_by_cust.items(), key=lambda x: -x[1])[:5]
    return [{"customer": cust_map.get(cid, {}).get("business_name", "Unknown"), "amount": amt} for cid, amt in top_overdue]


@api.get("/dashboard/recent-activity")
async def recent_activity(user_id: str = Depends(get_current_user_id)):
    invs = await db.invoices.find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1).limit(5).to_list(5)
    pays = await db.payments.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    fus = await db.followups.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {"invoices": invs, "payments": pays, "followups": fus}


# ============== CASHFLOW FORECAST ==============
@api.get("/cashflow/forecast")
async def cashflow_forecast(user_id: str = Depends(get_current_user_id)):
    invoices = await db.invoices.find({"user_id": user_id, "pending_amount": {"$gt": 0}}, {"_id": 0}).to_list(5000)
    customers = await db.customers.find({"user_id": user_id}, {"_id": 0}).to_list(5000)
    cust_map = {c["id"]: c for c in customers}

    today = _today()
    _ = today
    week_end = today + timedelta(days=7)
    month_end = today + timedelta(days=30)

    expected_week = 0
    expected_month = 0
    high_risk_pending = 0
    likely_delayed = 0
    best_case = 0
    worst_case = 0

    for inv in invoices:
        try:
            due = datetime.fromisoformat(inv["due_date"]).date()
        except Exception:
            continue
        amt = inv.get("pending_amount", 0)
        cust = cust_map.get(inv["customer_id"], {})
        risk = cust.get("risk_category", "Low Risk")

        # weight by risk for likely collection
        if risk == "Low Risk":
            weight = 0.95
        elif risk == "Medium Risk":
            weight = 0.75
        elif risk == "High Risk":
            weight = 0.45
        else:
            weight = 0.2

        if due <= week_end:
            expected_week += amt * weight
        if due <= month_end:
            expected_month += amt * weight

        if risk in ("High Risk", "Critical Risk"):
            high_risk_pending += amt
            likely_delayed += amt * (1 - weight)

        best_case += amt
        worst_case += amt * weight

    return {
        "expected_this_week": round(expected_week, 2),
        "expected_this_month": round(expected_month, 2),
        "high_risk_pending": round(high_risk_pending, 2),
        "likely_delayed": round(likely_delayed, 2),
        "best_case_recovery": round(best_case, 2),
        "worst_case_recovery": round(worst_case, 2),
    }


# ============== SETTINGS ==============
@api.get("/settings")
async def get_settings(user_id: str = Depends(get_current_user_id)):
    s = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    if not s:
        s = {
            "user_id": user_id,
            "default_payment_terms": 30,
            "default_followup_tone": "Professional",
            "default_reminder_days": [-3, 0, 3, 7, 15, 30],
            "reminder_channels": ["WhatsApp", "Email"],
            "currency": "INR",
            "ai_provider": "claude-sonnet-4-6",
            "updated_at": utcnow_iso(),
        }
        await db.settings.insert_one(s)
        s.pop("_id", None)
    return s


@api.put("/settings")
async def update_settings(payload: SettingsUpdate, user_id: str = Depends(get_current_user_id)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = utcnow_iso()
    await db.settings.update_one({"user_id": user_id}, {"$set": updates}, upsert=True)
    s = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    return s


# ============== HEALTH ==============
@api.get("/")
async def root():
    return {"app": "PayGuard AI", "status": "ok"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    logger.info("PayGuard AI starting…")
    try:
        await seed_demo_data(db)
        logger.info("Demo seed ensured.")
    except Exception as e:
        logger.exception(f"Seed failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
