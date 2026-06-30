"""PayGuard AI - Main FastAPI application (PostgreSQL)."""
import os
import re
import json
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy import select, update, delete, func, text, and_, or_, inspect as sa_inspect
from sqlalchemy.ext.asyncio import AsyncSession

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from logging_config import setup_logging, get_logger
from middleware import RequestLoggingMiddleware, register_exception_handler
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
from db import (
    engine, async_session, init_db, close_db,
    User, Customer, Invoice, Payment, Followup, Settings,
)

setup_logging()
logger = get_logger("payguard.server")

app = FastAPI(title="PayGuard AI")
api = APIRouter(prefix="/api")

register_exception_handler(app)


# ============== HELPERS ==============
def _today():
    return datetime.now(timezone.utc).date()


def _parse_date(s: str):
    return datetime.fromisoformat(s).date() if s else None


def _calc_invoice_status(due_date: str, pending_amount: float, total_amount: float, current_status: Optional[str] = None) -> str:
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


def _row_to_dict(row) -> dict:
    if row is None:
        return None
    return {c.key: getattr(row, c.key) for c in sa_inspect(row).mapper.column_attrs}


def _rows_to_dicts(rows) -> list:
    return [_row_to_dict(r[0]) if hasattr(r, '__getitem__') and len(r) == 1 else _row_to_dict(r) for r in rows]


def _count_broken_promises(followups: list, invoices: list) -> int:
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
    pending = sum(i.get("pending_amount", 0) for i in invoices)
    overdue_invoices = [i for i in invoices if i.get("pending_amount", 0) > 0 and _overdue_days(i.get("due_date", "")) > 0]
    overdue_count = len(overdue_invoices)
    avg_delay = (
        int(sum(_overdue_days(i.get("due_date", "")) for i in overdue_invoices) / overdue_count)
        if overdue_count else 0
    )
    return {"pending": pending, "overdue_count": overdue_count, "avg_delay": avg_delay}


async def _refresh_customer_risk(user_id: str, customer_id: str, session: AsyncSession):
    result = await session.execute(
        select(Invoice).where(Invoice.user_id == user_id, Invoice.customer_id == customer_id)
    )
    invoices = _rows_to_dicts(result.all())

    result = await session.execute(
        select(Followup).where(Followup.user_id == user_id, Followup.customer_id == customer_id)
    )
    followups = _rows_to_dicts(result.all())

    result = await session.execute(
        select(Customer).where(Customer.id == customer_id, Customer.user_id == user_id)
    )
    cust_row = result.scalar_one_or_none()
    if not cust_row:
        return
    customer = _row_to_dict(cust_row)

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

    await session.execute(
        update(Customer)
        .where(Customer.id == customer_id, Customer.user_id == user_id)
        .values(**risk, updated_at=utcnow_iso())
    )
    await session.commit()
    return {**risk, "broken_promises": broken_promises, "total_pending": stats["pending"]}


async def _user_to_public_dict(user_row) -> dict:
    d = _row_to_dict(user_row)
    return {
        "id": d["id"],
        "full_name": d["full_name"],
        "email": d["email"],
        "phone": d.get("phone", ""),
        "business_name": d["business_name"],
        "business_type": d.get("business_type", ""),
        "gst_number": d.get("gst_number", ""),
        "created_at": d["created_at"],
        "updated_at": d["updated_at"],
    }


# ============== AUTH ==============
@api.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == payload.email.lower()))
        if result.scalar_one_or_none():
            logger.warning(
                "Registration failed — email already registered",
                extra={"event": "auth.register.duplicate", "email": payload.email.lower()},
            )
            raise HTTPException(status_code=400, detail="Email already registered")
        now = utcnow_iso()
        user_id = new_id()
        user = User(
            id=user_id, full_name=payload.full_name, email=payload.email.lower(),
            phone=payload.phone or "", business_name=payload.business_name,
            business_type=payload.business_type or "", gst_number=payload.gst_number or "",
            password_hash=hash_password(payload.password), created_at=now, updated_at=now,
        )
        session.add(user)
        await session.flush()
        session.add(Settings(
            user_id=user_id, default_payment_terms=30, default_followup_tone="Professional",
            default_reminder_days="[-3, 0, 3, 7, 15, 30]", reminder_channels='["WhatsApp", "Email"]',
            currency="INR", ai_provider="claude-sonnet-4-6", updated_at=now,
        ))
        await session.commit()
        token = create_access_token(user_id)
        logger.info(
            "User registered successfully",
            extra={"event": "auth.register", "user_id": user_id, "email": payload.email.lower()},
        )
        return {"access_token": token, "token_type": "bearer", "user": await _user_to_public_dict(user)}


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == payload.email.lower()))
        user_row = result.scalar_one_or_none()
        if not user_row or not verify_password(payload.password, user_row.password_hash):
            logger.warning(
                "Login failed — invalid credentials",
                extra={"event": "auth.login.failure", "email": payload.email.lower()},
            )
            raise HTTPException(status_code=401, detail="Invalid email or password")
        token = create_access_token(user_row.id)
        logger.info(
            "Login successful",
            extra={"event": "auth.login.success", "user_id": user_row.id, "email": payload.email.lower()},
        )
        return {"access_token": token, "token_type": "bearer", "user": await _user_to_public_dict(user_row)}


@api.get("/auth/me", response_model=UserPublic)
async def me(user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user_row = result.scalar_one_or_none()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        return await _user_to_public_dict(user_row)


# ============== CUSTOMERS ==============
@api.get("/customers")
async def list_customers(
    user_id: str = Depends(get_current_user_id),
    search: Optional[str] = None,
    risk: Optional[str] = None,
):
    async with async_session() as session:
        q = select(Customer).where(Customer.user_id == user_id)
        if search:
            q = q.where(Customer.business_name.ilike(f"%{search}%"))
        if risk and risk != "All":
            q = q.where(Customer.risk_category == risk)
        q = q.order_by(Customer.created_at.desc())
        result = await session.execute(q)
        items = _rows_to_dicts(result.all())

        for c in items:
            inv_result = await session.execute(
                select(Invoice).where(Invoice.user_id == user_id, Invoice.customer_id == c["id"])
            )
            invs = _rows_to_dicts(inv_result.all())
            c["total_invoiced"] = sum(i.get("total_amount", 0) for i in invs)
            c["total_pending"] = sum(i.get("pending_amount", 0) for i in invs)
            c["invoice_count"] = len(invs)
        return items


@api.post("/customers")
async def create_customer(payload: CustomerCreate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        now = utcnow_iso()
        doc = Customer(
            id=new_id(), user_id=user_id, **payload.model_dump(),
            risk_score=0, risk_category="Low Risk",
            risk_reason="New customer, no payment history yet.",
            risk_action="Maintain standard credit terms and monitor first transactions.",
            created_at=now, updated_at=now,
        )
        session.add(doc)
        await session.commit()
        logger.info(
            "Customer created",
            extra={"event": "db.customer.create", "user_id": user_id, "customer_id": doc.id, "business_name": payload.business_name},
        )
        return _row_to_dict(doc)


@api.get("/customers/{cid}")
async def get_customer(cid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Customer).where(Customer.id == cid, Customer.user_id == user_id)
        )
        c = result.scalar_one_or_none()
        if not c:
            raise HTTPException(status_code=404, detail="Customer not found")

        inv_result = await session.execute(
            select(Invoice).where(Invoice.user_id == user_id, Invoice.customer_id == cid).order_by(Invoice.invoice_date.desc())
        )
        invoices = _rows_to_dicts(inv_result.all())

        pay_result = await session.execute(
            select(Payment).where(Payment.user_id == user_id, Payment.customer_id == cid).order_by(Payment.payment_date.desc())
        )
        payments = _rows_to_dicts(pay_result.all())

        fu_result = await session.execute(
            select(Followup).where(Followup.user_id == user_id, Followup.customer_id == cid).order_by(Followup.created_at.desc())
        )
        followups = _rows_to_dicts(fu_result.all())

        cd = _row_to_dict(c)
        cd["invoices"] = invoices
        cd["payments"] = payments
        cd["followups"] = followups
        cd["total_pending"] = sum(i.get("pending_amount", 0) for i in invoices)
        cd["total_invoiced"] = sum(i.get("total_amount", 0) for i in invoices)
        return cd


@api.put("/customers/{cid}")
async def update_customer(cid: str, payload: CustomerUpdate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Customer).where(Customer.id == cid, Customer.user_id == user_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Customer not found")
        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        updates["updated_at"] = utcnow_iso()
        await session.execute(
            update(Customer).where(Customer.id == cid, Customer.user_id == user_id).values(**updates)
        )
        await session.commit()
        logger.info(
            "Customer updated",
            extra={"event": "db.customer.update", "user_id": user_id, "customer_id": cid},
        )
        result = await session.execute(
            select(Customer).where(Customer.id == cid, Customer.user_id == user_id)
        )
        return _row_to_dict(result.scalar_one())


@api.delete("/customers/{cid}")
async def delete_customer(cid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            delete(Customer).where(Customer.id == cid, Customer.user_id == user_id).returning(Customer.id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Customer not found")
        await session.execute(delete(Invoice).where(Invoice.user_id == user_id, Invoice.customer_id == cid))
        await session.execute(delete(Payment).where(Payment.user_id == user_id, Payment.customer_id == cid))
        await session.execute(delete(Followup).where(Followup.user_id == user_id, Followup.customer_id == cid))
        await session.commit()
        logger.info(
            "Customer deleted",
            extra={"event": "db.customer.delete", "user_id": user_id, "customer_id": cid},
        )
        return {"ok": True}


@api.get("/customers/{cid}/risk")
async def customer_risk(cid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Customer).where(Customer.id == cid, Customer.user_id == user_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Customer not found")
        risk = await _refresh_customer_risk(user_id, cid, session)
        return risk or {"risk_score": 0, "risk_category": "Low Risk"}


# ============== INVOICES ==============
@api.get("/invoices")
async def list_invoices(
    user_id: str = Depends(get_current_user_id),
    status_filter: Optional[str] = Query(None, alias="status"),
    customer_id: Optional[str] = None,
    search: Optional[str] = None,
):
    async with async_session() as session:
        q = select(Invoice).where(Invoice.user_id == user_id)
        if status_filter and status_filter != "All":
            q = q.where(Invoice.status == status_filter)
        if customer_id:
            q = q.where(Invoice.customer_id == customer_id)
        if search:
            q = q.where(Invoice.invoice_number.ilike(f"%{search}%"))
        q = q.order_by(Invoice.due_date.asc())
        result = await session.execute(q)
        items = _rows_to_dicts(result.all())

        cust_ids = list({i["customer_id"] for i in items})
        customer_map = {}
        if cust_ids:
            cust_result = await session.execute(
                select(Customer).where(Customer.id.in_(cust_ids), Customer.user_id == user_id)
            )
            customer_map = {c[0].id: _row_to_dict(c[0]) for c in cust_result.all()}

        for inv in items:
            inv["_original_status"] = inv["status"]
            new_status = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
            if new_status != inv.get("status"):
                inv["status"] = new_status
            inv["overdue_days"] = max(0, _overdue_days(inv["due_date"])) if inv.get("pending_amount", 0) > 0 else 0
            c = customer_map.get(inv["customer_id"])
            inv["customer_name"] = c["business_name"] if c else ""
            inv["customer_risk"] = c.get("risk_category", "Low Risk") if c else "Low Risk"

        for inv in items:
            if inv.get("status") != inv.get("_original_status"):
                await session.execute(
                    update(Invoice).where(Invoice.id == inv["id"], Invoice.user_id == user_id)
                    .values(status=inv["status"], updated_at=utcnow_iso())
                )
        await session.commit()
        return items


@api.post("/invoices")
async def create_invoice(payload: InvoiceCreate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Customer).where(Customer.id == payload.customer_id, Customer.user_id == user_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Customer not found")
        total = payload.amount + payload.tax_amount
        now = utcnow_iso()
        inv_status = _calc_invoice_status(payload.due_date, total, total, None)
        doc = Invoice(
            id=new_id(), user_id=user_id, **payload.model_dump(),
            total_amount=total, paid_amount=0, pending_amount=total,
            status=inv_status, file_url="", created_at=now, updated_at=now,
        )
        session.add(doc)
        await session.commit()
        await _refresh_customer_risk(user_id, payload.customer_id, session)
        logger.info(
            "Invoice created",
            extra={
                "event": "db.invoice.create",
                "user_id": user_id,
                "invoice_id": doc.id,
                "invoice_number": payload.invoice_number,
                "customer_id": payload.customer_id,
                "total_amount": total,
            },
        )
        return _row_to_dict(doc)


@api.get("/invoices/{iid}")
async def get_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)

        cust_result = await session.execute(
            select(Customer).where(Customer.id == inv_d["customer_id"], Customer.user_id == user_id)
        )
        cust = cust_result.scalar_one_or_none()

        pay_result = await session.execute(
            select(Payment).where(Payment.user_id == user_id, Payment.invoice_id == iid).order_by(Payment.payment_date.desc())
        )
        payments = _rows_to_dicts(pay_result.all())

        fu_result = await session.execute(
            select(Followup).where(Followup.user_id == user_id, Followup.invoice_id == iid).order_by(Followup.created_at.desc())
        )
        followups = _rows_to_dicts(fu_result.all())

        new_status = _calc_invoice_status(inv_d["due_date"], inv_d.get("pending_amount", 0), inv_d.get("total_amount", 0), inv_d.get("status"))
        inv_d["status"] = new_status
        inv_d["overdue_days"] = max(0, _overdue_days(inv_d["due_date"])) if inv_d.get("pending_amount", 0) > 0 else 0
        inv_d["customer"] = _row_to_dict(cust) if cust else None
        inv_d["payments"] = payments
        inv_d["followups"] = followups
        return inv_d


@api.put("/invoices/{iid}")
async def update_invoice(iid: str, payload: InvoiceUpdate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="Invoice not found")
        existing_d = _row_to_dict(existing)
        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        if "amount" in updates or "tax_amount" in updates:
            amt = updates.get("amount", existing_d["amount"])
            tax = updates.get("tax_amount", existing_d["tax_amount"])
            updates["total_amount"] = amt + tax
            updates["pending_amount"] = max(0, updates["total_amount"] - existing_d.get("paid_amount", 0))
        updates["updated_at"] = utcnow_iso()
        new_doc = {**existing_d, **updates}
        updates["status"] = _calc_invoice_status(new_doc["due_date"], new_doc.get("pending_amount", 0), new_doc.get("total_amount", 0), updates.get("status") or existing_d.get("status"))
        await session.execute(
            update(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id).values(**updates)
        )
        await session.commit()
        await _refresh_customer_risk(user_id, existing_d["customer_id"], session)
        logger.info(
            "Invoice updated",
            extra={"event": "db.invoice.update", "user_id": user_id, "invoice_id": iid},
        )
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        return _row_to_dict(result.scalar_one())


@api.delete("/invoices/{iid}")
async def delete_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        customer_id = inv.customer_id
        await session.execute(delete(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id))
        await session.execute(delete(Payment).where(Payment.user_id == user_id, Payment.invoice_id == iid))
        await session.execute(delete(Followup).where(Followup.user_id == user_id, Followup.invoice_id == iid))
        await session.commit()
        await _refresh_customer_risk(user_id, customer_id, session)
        logger.info(
            "Invoice deleted",
            extra={"event": "db.invoice.delete", "user_id": user_id, "invoice_id": iid},
        )
        return {"ok": True}


@api.post("/invoices/{iid}/mark-paid")
async def mark_paid(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)
        pending = inv_d.get("pending_amount", 0)
        if pending > 0:
            session.add(Payment(
                id=new_id(), invoice_id=iid, customer_id=inv_d["customer_id"],
                user_id=user_id, amount=pending, payment_date=_today().isoformat(),
                payment_mode="Manual", reference_number="", notes="Marked as paid",
                created_at=utcnow_iso(),
            ))
        await session.execute(
            update(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
            .values(paid_amount=inv_d.get("total_amount", 0), pending_amount=0, status="Paid", updated_at=utcnow_iso())
        )
        await session.commit()
        await _refresh_customer_risk(user_id, inv_d["customer_id"], session)
        logger.info(
            "Invoice marked as paid",
            extra={
                "event": "invoice.marked_paid",
                "user_id": user_id,
                "invoice_id": iid,
                "pending_amount": pending,
            },
        )
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        return _row_to_dict(result.scalar_one())


@api.get("/invoices/{iid}/timeline")
async def invoice_timeline(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == iid, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)
        due = datetime.fromisoformat(inv_d["due_date"]).date()
        today = _today()
        steps = [
            (-3, "Gentle reminder", "Send a friendly heads-up before the due date."),
            (0, "Due date reminder", "Confirm the payment is being processed."),
            (3, "First overdue reminder", "Politely follow up on the overdue payment."),
            (7, "Strong reminder", "Increase urgency and request a payment commitment."),
            (15, "Call script & escalation", "Make a direct call and consider escalation."),
            (30, "Final warning", "Send final warning and prepare legal action notice."),
        ]
        fu_result = await session.execute(
            select(Followup).where(Followup.user_id == user_id, Followup.invoice_id == iid)
        )
        followups = _rows_to_dicts(fu_result.all())
        timeline = []
        for offset, action, desc in steps:
            action_date = due + timedelta(days=offset)
            completed = any(
                abs((datetime.fromisoformat(f["created_at"][:10]).date() - action_date).days) <= 1 and
                f.get("followup_type", "").lower().split()[0] in action.lower()
                for f in followups
            )
            status = "completed" if completed else ("due" if action_date <= today else "upcoming")
            timeline.append({
                "offset_days": offset, "action": action, "description": desc,
                "date": action_date.isoformat(), "status": status,
            })
        return {"invoice_id": iid, "due_date": inv_d["due_date"], "timeline": timeline}


# ============== PAYMENTS ==============
@api.get("/payments")
async def list_payments(user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Payment).where(Payment.user_id == user_id).order_by(Payment.payment_date.desc())
        )
        items = _rows_to_dicts(result.all())

        inv_ids = list({p["invoice_id"] for p in items})
        inv_map = {}
        if inv_ids:
            inv_result = await session.execute(
                select(Invoice).where(Invoice.id.in_(inv_ids), Invoice.user_id == user_id)
            )
            inv_map = {i[0].id: _row_to_dict(i[0]) for i in inv_result.all()}

        cust_ids = list({p["customer_id"] for p in items})
        cust_map = {}
        if cust_ids:
            cust_result = await session.execute(
                select(Customer).where(Customer.id.in_(cust_ids), Customer.user_id == user_id)
            )
            cust_map = {c[0].id: _row_to_dict(c[0]) for c in cust_result.all()}

        for p in items:
            p["invoice_number"] = inv_map.get(p["invoice_id"], {}).get("invoice_number", "")
            p["customer_name"] = cust_map.get(p["customer_id"], {}).get("business_name", "")
        return items


@api.post("/payments")
async def create_payment(payload: PaymentCreate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == payload.invoice_id, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)
        now = utcnow_iso()
        doc = Payment(
            id=new_id(), user_id=user_id, customer_id=inv_d["customer_id"],
            **payload.model_dump(), created_at=now,
        )
        session.add(doc)
        new_paid = inv_d.get("paid_amount", 0) + payload.amount
        new_pending = max(0, inv_d.get("total_amount", 0) - new_paid)
        new_status = _calc_invoice_status(inv_d["due_date"], new_pending, inv_d.get("total_amount", 0), inv_d.get("status"))
        await session.execute(
            update(Invoice).where(Invoice.id == inv_d["id"], Invoice.user_id == user_id)
            .values(paid_amount=new_paid, pending_amount=new_pending, status=new_status, updated_at=utcnow_iso())
        )
        await session.commit()
        await _refresh_customer_risk(user_id, inv_d["customer_id"], session)
        logger.info(
            "Payment recorded",
            extra={
                "event": "db.payment.create",
                "user_id": user_id,
                "payment_id": doc.id,
                "invoice_id": payload.invoice_id,
                "amount": payload.amount,
                "payment_mode": payload.payment_mode,
            },
        )
        return _row_to_dict(doc)


@api.get("/payments/invoice/{iid}")
async def payments_for_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Payment).where(Payment.user_id == user_id, Payment.invoice_id == iid).order_by(Payment.payment_date.desc())
        )
        return _rows_to_dicts(result.all())


# ============== FOLLOW-UPS ==============
@api.get("/followups")
async def list_followups(user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Followup).where(Followup.user_id == user_id).order_by(Followup.created_at.desc())
        )
        return _rows_to_dicts(result.all())


@api.post("/followups")
async def create_followup(payload: FollowUpCreate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == payload.invoice_id, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)
        doc = Followup(
            id=new_id(), user_id=user_id, customer_id=inv_d["customer_id"],
            **payload.model_dump(), created_at=utcnow_iso(),
        )
        session.add(doc)
        await session.commit()
        await _refresh_customer_risk(user_id, inv_d["customer_id"], session)
        logger.info(
            "Follow-up created",
            extra={
                "event": "db.followup.create",
                "user_id": user_id,
                "followup_id": doc.id,
                "invoice_id": payload.invoice_id,
                "followup_type": payload.followup_type,
                "channel": payload.channel,
            },
        )
        return _row_to_dict(doc)


@api.get("/followups/invoice/{iid}")
async def followups_for_invoice(iid: str, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Followup).where(Followup.user_id == user_id, Followup.invoice_id == iid).order_by(Followup.created_at.desc())
        )
        return _rows_to_dicts(result.all())


@api.put("/followups/{fid}")
async def update_followup(fid: str, payload: FollowUpUpdate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Followup).where(Followup.id == fid, Followup.user_id == user_id)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            raise HTTPException(status_code=404, detail="Follow-up not found")
        existing_d = _row_to_dict(existing)
        updates = {k: v for k, v in payload.model_dump().items() if v is not None}
        if updates:
            await session.execute(
                update(Followup).where(Followup.id == fid, Followup.user_id == user_id).values(**updates)
            )
            await session.commit()
            logger.info(
                "Follow-up updated",
                extra={
                    "event": "db.followup.update",
                    "user_id": user_id,
                    "followup_id": fid,
                    "updated_fields": list(updates.keys()),
                },
            )
        await _refresh_customer_risk(user_id, existing_d["customer_id"], session)
        result = await session.execute(
            select(Followup).where(Followup.id == fid, Followup.user_id == user_id)
        )
        return _row_to_dict(result.scalar_one())


# ============== AI ==============
@api.post("/ai/parse-invoice")
async def ai_parse_invoice(file: UploadFile = File(...), user_id: str = Depends(get_current_user_id)):
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
    name = (result.get("customer_business_name") or "").strip()
    if name:
        async with async_session() as session:
            cust_result = await session.execute(
                select(Customer).where(
                    Customer.user_id == user_id,
                    Customer.business_name.ilike(name),
                )
            )
            cust = cust_result.scalar_one_or_none()
            if cust:
                result["matched_customer_id"] = cust.id
    return result


@api.post("/ai/generate-followup")
async def ai_generate_followup(payload: AIFollowupRequest, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Invoice).where(Invoice.id == payload.invoice_id, Invoice.user_id == user_id)
        )
        inv = result.scalar_one_or_none()
        if not inv:
            raise HTTPException(status_code=404, detail="Invoice not found")
        inv_d = _row_to_dict(inv)

        cust_result = await session.execute(
            select(Customer).where(Customer.id == inv_d["customer_id"], Customer.user_id == user_id)
        )
        cust = cust_result.scalar_one_or_none()
        cust_d = _row_to_dict(cust) if cust else {}

        user_result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        user_d = _row_to_dict(user) if user else {}

        count_result = await session.execute(
            select(func.count()).select_from(Followup).where(Followup.user_id == user_id, Followup.invoice_id == payload.invoice_id)
        )
        prev_count = count_result.scalar() or 0

        ai_result = await generate_followup_ai(
            customer_name=cust_d.get("business_name", "Customer"),
            invoice_number=inv_d["invoice_number"],
            amount=inv_d.get("total_amount", inv_d["amount"]),
            due_date=inv_d["due_date"],
            overdue_days=_overdue_days(inv_d["due_date"]),
            tone=payload.tone,
            message_type=payload.message_type,
            business_name=user_d.get("business_name", "Your Business"),
            previous_followups=prev_count,
            risk_category=cust_d.get("risk_category", "Low Risk"),
        )
        logger.info(
            "Follow-up generation requested via API",
            extra={
                "event": "ai.generate_followup.request",
                "user_id": user_id,
                "invoice_id": payload.invoice_id,
                "tone": payload.tone,
                "message_type": payload.message_type,
                "source": ai_result.get("_source", "unknown"),
            },
        )
        return ai_result


@api.post("/ai/generate-risk-summary")
async def ai_risk_summary(payload: AIRiskRequest, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        result = await session.execute(
            select(Customer).where(Customer.id == payload.customer_id, Customer.user_id == user_id)
        )
        cust = result.scalar_one_or_none()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer not found")
        risk = await _refresh_customer_risk(user_id, payload.customer_id, session)
        return {"customer": cust.business_name, **(risk or {})}


@api.post("/ai/generate-recovery-report")
async def ai_recovery_report(payload: AIReportRequest, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        user_result = await session.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        biz = user.business_name if user else "Your Business"

        if payload.customer_id:
            cust_result = await session.execute(
                select(Customer).where(Customer.id == payload.customer_id, Customer.user_id == user_id)
            )
            cust = cust_result.scalar_one_or_none()
            if not cust:
                raise HTTPException(status_code=404, detail="Customer not found")
            risk = await _refresh_customer_risk(user_id, payload.customer_id, session) or {}

            inv_result = await session.execute(
                select(Invoice).where(
                    Invoice.user_id == user_id, Invoice.customer_id == payload.customer_id,
                    Invoice.pending_amount > 0
                )
            )
            invs = _rows_to_dicts(inv_result.all())

            fu_result = await session.execute(
                select(Followup).where(Followup.user_id == user_id, Followup.customer_id == payload.customer_id)
            )
            followups = _rows_to_dicts(fu_result.all())

            for i in invs:
                i["overdue_days"] = max(0, _overdue_days(i["due_date"]))
            total_pending = sum(i["pending_amount"] for i in invs)
            report = build_recovery_report(
                customer_name=cust.business_name, invoice_summary=invs, risk_info=risk,
                business_name=biz, total_pending=total_pending,
                followup_count=len(followups), broken_promises=risk.get("broken_promises", 0),
            )
            return {"report": report, "total_pending": total_pending, "risk": risk, "customer": _row_to_dict(cust)}

        elif payload.invoice_id:
            inv_result = await session.execute(
                select(Invoice).where(Invoice.id == payload.invoice_id, Invoice.user_id == user_id)
            )
            inv = inv_result.scalar_one_or_none()
            if not inv:
                raise HTTPException(status_code=404, detail="Invoice not found")
            inv_d = _row_to_dict(inv)

            cust_result = await session.execute(
                select(Customer).where(Customer.id == inv_d["customer_id"], Customer.user_id == user_id)
            )
            cust = cust_result.scalar_one_or_none()
            risk = await _refresh_customer_risk(user_id, inv_d["customer_id"], session) or {}

            fu_result = await session.execute(
                select(Followup).where(Followup.user_id == user_id, Followup.invoice_id == payload.invoice_id)
            )
            followups = _rows_to_dicts(fu_result.all())

            inv_d["overdue_days"] = max(0, _overdue_days(inv_d["due_date"]))
            report = build_recovery_report(
                customer_name=cust.business_name if cust else "",
                invoice_summary=[inv_d], risk_info=risk, business_name=biz,
                total_pending=inv_d.get("pending_amount", 0),
                followup_count=len(followups), broken_promises=risk.get("broken_promises", 0),
            )
            return {"report": report, "invoice": inv_d, "risk": risk, "customer": _row_to_dict(cust) if cust else None}
    raise HTTPException(status_code=400, detail="Provide customer_id or invoice_id")


# ============== DASHBOARD ==============
@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        inv_result = await session.execute(
            select(Invoice).where(Invoice.user_id == user_id)
        )
        invoices = _rows_to_dicts(inv_result.all())

        cust_result = await session.execute(
            select(Customer).where(Customer.user_id == user_id)
        )
        customers = _rows_to_dicts(cust_result.all())

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
    async with async_session() as session:
        inv_result = await session.execute(
            select(Invoice).where(Invoice.user_id == user_id)
        )
        invoices = _rows_to_dicts(inv_result.all())

        cust_result = await session.execute(
            select(Customer).where(Customer.user_id == user_id)
        )
        customers = _rows_to_dicts(cust_result.all())

        pay_result = await session.execute(
            select(Payment).where(Payment.user_id == user_id)
        )
        payments = _rows_to_dicts(pay_result.all())

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
    status_dist = {}
    for inv in invoices:
        s = _calc_invoice_status(inv["due_date"], inv.get("pending_amount", 0), inv.get("total_amount", 0), inv.get("status"))
        status_dist[s] = status_dist.get(s, 0) + 1
    return status_dist


def _build_risk_distribution(customers: list) -> dict:
    risk_dist = {}
    for c in customers:
        r = c.get("risk_category", "Low Risk")
        risk_dist[r] = risk_dist.get(r, 0) + 1
    return risk_dist


def _build_monthly_trend(payments: list) -> list:
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
    async with async_session() as session:
        inv_result = await session.execute(
            select(Invoice).where(Invoice.user_id == user_id).order_by(Invoice.updated_at.desc()).limit(5)
        )
        invs = _rows_to_dicts(inv_result.all())

        pay_result = await session.execute(
            select(Payment).where(Payment.user_id == user_id).order_by(Payment.created_at.desc()).limit(5)
        )
        pays = _rows_to_dicts(pay_result.all())

        fu_result = await session.execute(
            select(Followup).where(Followup.user_id == user_id).order_by(Followup.created_at.desc()).limit(5)
        )
        fus = _rows_to_dicts(fu_result.all())

        return {"invoices": invs, "payments": pays, "followups": fus}


# ============== CASHFLOW FORECAST ==============
@api.get("/cashflow/forecast")
async def cashflow_forecast(user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        inv_result = await session.execute(
            select(Invoice).where(Invoice.user_id == user_id, Invoice.pending_amount > 0)
        )
        invoices = _rows_to_dicts(inv_result.all())

        cust_result = await session.execute(
            select(Customer).where(Customer.user_id == user_id)
        )
        customers = _rows_to_dicts(cust_result.all())

    cust_map = {c["id"]: c for c in customers}
    today = _today()
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
    async with async_session() as session:
        result = await session.execute(
            select(Settings).where(Settings.user_id == user_id)
        )
        s = result.scalar_one_or_none()
        if not s:
            now = utcnow_iso()
            s = Settings(
                user_id=user_id, default_payment_terms=30, default_followup_tone="Professional",
                default_reminder_days="[-3, 0, 3, 7, 15, 30]", reminder_channels='["WhatsApp", "Email"]',
                currency="INR", ai_provider="claude-sonnet-4-6", updated_at=now,
            )
            session.add(s)
            await session.commit()
            await session.refresh(s)
        sd = _row_to_dict(s)
        sd["default_reminder_days"] = json.loads(sd["default_reminder_days"])
        sd["reminder_channels"] = json.loads(sd["reminder_channels"])
        return sd


@api.put("/settings")
async def update_settings(payload: SettingsUpdate, user_id: str = Depends(get_current_user_id)):
    async with async_session() as session:
        updates = {}
        for k, v in payload.model_dump().items():
            if v is not None:
                if k in ("default_reminder_days", "reminder_channels"):
                    updates[k] = json.dumps(v)
                else:
                    updates[k] = v
        updates["updated_at"] = utcnow_iso()

        result = await session.execute(
            select(Settings).where(Settings.user_id == user_id)
        )
        existing = result.scalar_one_or_none()
        if existing:
            await session.execute(
                update(Settings).where(Settings.user_id == user_id).values(**updates)
            )
        else:
            updates["user_id"] = user_id
            session.add(Settings(**updates))
        await session.commit()

        logger.info(
            "Settings updated",
            extra={
                "event": "db.settings.update",
                "user_id": user_id,
                "updated_fields": list(updates.keys()),
            },
        )

        result = await session.execute(
            select(Settings).where(Settings.user_id == user_id)
        )
        s = _row_to_dict(result.scalar_one())
        s["default_reminder_days"] = json.loads(s["default_reminder_days"])
        s["reminder_channels"] = json.loads(s["reminder_channels"])
        return s


# ============== HEALTH ==============
@api.get("/")
async def root():
    return {"app": "PayGuard AI", "status": "ok"}


app.include_router(api)

app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    logger.info(
        "Application startup",
        extra={
            "event": "app.startup",
            "database_url_host": os.environ.get("DATABASE_URL", "").split("@")[-1] if "@" in os.environ.get("DATABASE_URL", "") else "unknown",
            "log_level": os.environ.get("LOG_LEVEL", "INFO"),
            "cors_origins": os.environ.get("CORS_ORIGINS", "*"),
        },
    )
    await init_db()
    try:
        from seed import seed_demo_data
        async with async_session() as session:
            await seed_demo_data(session)
    except Exception as e:
        logger.exception(
            f"Seed failed: {e}",
            extra={"event": "seed.failed", "error_type": type(e).__name__, "error_message": str(e)},
        )


@app.on_event("shutdown")
async def on_shutdown():
    logger.info(
        "Application shutdown",
        extra={"event": "app.shutdown"},
    )
    await close_db()
