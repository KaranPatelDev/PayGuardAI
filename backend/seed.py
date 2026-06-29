"""PayGuard AI - Demo seed data."""
import os
from datetime import datetime, timedelta, timezone
from auth_utils import hash_password
from models import utcnow_iso, new_id

DEMO_EMAIL = os.environ.get("DEMO_EMAIL", "demo@payguard.ai")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "demo123")


async def seed_demo_data(db):
    """Idempotent demo seed for Patel Industrial Supplies."""
    existing = await db.users.find_one({"email": DEMO_EMAIL}, {"_id": 0})
    if existing:
        return existing["id"]

    now = utcnow_iso()
    user_id = new_id()
    user = {
        "id": user_id,
        "full_name": "Rakesh Patel",
        "email": DEMO_EMAIL,
        "phone": "+91 98765 43210",
        "business_name": "Patel Industrial Supplies",
        "business_type": "Manufacturing & Wholesale",
        "gst_number": "24ABCDE1234F1Z5",
        "password_hash": hash_password(DEMO_PASSWORD),
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user)

    # Customers
    customers_data = [
        ("ABC Traders", "Rajesh Kumar", "rajesh@abctraders.in", "+91 98111 22233", "Mumbai", "Maharashtra", "27ABCAB1234A1Z1", 30, 300000),
        ("Shree Ganesh Manufacturing", "Mahesh Sharma", "mahesh@shreeganesh.com", "+91 98222 33344", "Ahmedabad", "Gujarat", "24SGMAB5678B1Z2", 45, 500000),
        ("Raj Steel Corporation", "Vijay Singh", "vijay@rajsteel.in", "+91 98333 44455", "Surat", "Gujarat", "24RSCAB9012C1Z3", 30, 600000),
        ("Om Packaging Solutions", "Priya Mehta", "priya@ompack.com", "+91 98444 55566", "Pune", "Maharashtra", "27OPSAB3456D1Z4", 30, 200000),
        ("Krishna Hardware Mart", "Anil Verma", "anil@krishnahw.in", "+91 98555 66677", "Indore", "Madhya Pradesh", "23KHMAB7890E1Z5", 15, 150000),
    ]
    customer_ids = []
    for biz, person, email, phone, city, state, gst, terms, credit in customers_data:
        cid = new_id()
        customer_ids.append(cid)
        await db.customers.insert_one({
            "id": cid, "user_id": user_id, "business_name": biz, "contact_person": person,
            "email": email, "phone": phone, "address": "", "city": city, "state": state,
            "gst_number": gst, "payment_terms": terms, "credit_limit": credit,
            "notes": "", "risk_score": 0, "risk_category": "Low Risk",
            "risk_reason": "", "risk_action": "",
            "created_at": now, "updated_at": now,
        })

    # Invoices
    today = datetime.now(timezone.utc).date()
    invoices_data = [
        # (idx_customer, inv_no, days_before_today_invoice, due_offset_days, amount, status_hint)
        (0, "INV-1001", 52, 30, 125000, "overdue22"),       # overdue 22 days
        (1, "Shree-INV-2024-08", 27, 30, 74500, "due_soon"), # due in 3 days
        (2, "INV-2041", 68, 30, 240000, "overdue38"),       # overdue 38 days
        (3, "INV-1004", 35, 30, 48000, "paid"),             # paid
        (4, "INV-KH-554", 20, 20, 96700, "due_today"),      # due today
    ]
    invoice_ids = []
    for ci, inv_no, days_back, due_off, amt, hint in invoices_data:
        inv_id = new_id()
        invoice_ids.append((inv_id, ci, hint, amt))
        inv_date = today - timedelta(days=days_back)
        due_date = inv_date + timedelta(days=due_off)
        tax = round(amt * 0.18, 2)
        total = round(amt + tax, 2)
        paid = total if hint == "paid" else 0
        pending = 0 if hint == "paid" else total
        status = "Paid" if hint == "paid" else (
            "Overdue" if "overdue" in hint else (
                "Due Today" if hint == "due_today" else "Due Soon"
            )
        )
        await db.invoices.insert_one({
            "id": inv_id, "user_id": user_id, "customer_id": customer_ids[ci],
            "invoice_number": inv_no,
            "invoice_date": inv_date.isoformat(),
            "due_date": due_date.isoformat(),
            "amount": amt, "tax_amount": tax, "total_amount": total,
            "paid_amount": paid, "pending_amount": pending,
            "status": status, "payment_terms": 30,
            "description": f"Materials supply — {inv_no}",
            "file_url": "", "created_at": now, "updated_at": now,
        })

    # Payment for paid invoice
    paid_inv = next(x for x in invoice_ids if x[2] == "paid")
    await db.payments.insert_one({
        "id": new_id(), "invoice_id": paid_inv[0],
        "customer_id": customer_ids[3], "user_id": user_id,
        "amount": round(paid_inv[3] * 1.18, 2),
        "payment_date": (today - timedelta(days=5)).isoformat(),
        "payment_mode": "Bank Transfer",
        "reference_number": "UTR8843211009",
        "notes": "Full payment received", "created_at": now,
    })

    # Some follow-up history for high-risk customers (Raj Steel and ABC Traders)
    raj_inv = next(x for x in invoice_ids if x[2] == "overdue38")
    abc_inv = next(x for x in invoice_ids if x[2] == "overdue22")

    followups = [
        # Raj Steel - 4 follow-ups, 2 broken promises
        (raj_inv[0], customer_ids[2], "Gentle reminder", "WhatsApp", "Polite", "Sent", 30),
        (raj_inv[0], customer_ids[2], "First overdue reminder", "Email", "Professional", "Promise Received", 22, "Will pay by next Monday"),
        (raj_inv[0], customer_ids[2], "Strong reminder", "Phone Call", "Strict", "Promise Received", 12, "Confirmed payment this week"),
        (raj_inv[0], customer_ids[2], "Final escalation warning", "Email", "Final warning", "Ignored", 2),
        # ABC Traders - 2 follow-ups
        (abc_inv[0], customer_ids[0], "First overdue reminder", "WhatsApp", "Professional", "Sent", 15),
        (abc_inv[0], customer_ids[0], "Strong reminder", "Email", "Strict", "Responded", 5, "Asked for invoice copy"),
    ]
    for fu in followups:
        inv_id, cust_id, ftype, channel, tone, status, days_back, *rest = fu
        response = rest[0] if rest else ""
        # mark broken promises: status was 'Promise Received' but invoice still pending and promised date passed
        await db.followups.insert_one({
            "id": new_id(), "invoice_id": inv_id, "customer_id": cust_id,
            "user_id": user_id, "followup_type": ftype,
            "message": f"AI-generated {tone} {ftype} sent via {channel}.",
            "email_subject": f"Payment Reminder: {ftype}",
            "email_body": f"Dear customer, this is a {tone.lower()} reminder regarding the overdue payment...",
            "call_script": "Namaste ji, calling regarding pending payment...",
            "channel": channel, "tone": tone, "status": status,
            "promised_payment_date": (today - timedelta(days=days_back - 7)).isoformat() if status == "Promise Received" else None,
            "customer_response": response,
            "created_at": (datetime.now(timezone.utc) - timedelta(days=days_back)).isoformat(),
        })

    # Settings
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

    return user_id
