"""PayGuard AI - AI service (LLM + rule-based fallback) for follow-ups, risk, reports."""
import os
import json
import re
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from logging_config import get_logger

logger = get_logger("payguard.ai")

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


@dataclass
class FollowupConfig:
    """Configuration for follow-up message generation."""
    customer_name: str
    invoice_number: str
    amount: float
    due_date: str
    overdue_days: int
    tone: str
    message_type: str
    business_name: str
    previous_followups: int = 0
    risk_category: str = "Low Risk"
    paid_amount: float = 0
    pending_amount: float = 0
    tax_amount: float = 0
    invoice_status: str = "Sent"
    payment_history: list = None

    def __post_init__(self):
        if self.payment_history is None:
            self.payment_history = []


async def parse_invoice_file(file_bytes: bytes, mime_type: str) -> dict:
    """Extract invoice fields from an uploaded PDF/image using Claude Sonnet 4.5 vision."""
    logger.info(
        "Invoice OCR started",
        extra={"event": "ai.ocr.started", "mime_type": mime_type, "file_size_bytes": len(file_bytes)},
    )

    if not EMERGENT_LLM_KEY:
        logger.warning(
            "Invoice OCR skipped — AI key not configured",
            extra={"event": "ai.ocr.skipped", "reason": "no_api_key"},
        )
        return {"_source": "no_key", "_error": "AI key not configured"}

    suffix_map = {
        "application/pdf": ".pdf",
        "image/png": ".png", "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/webp": ".webp",
    }
    suffix = suffix_map.get(mime_type, ".pdf")
    tmp_path = None
    start = time.time()
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType

        system = (
            "You are an expert invoice OCR assistant for Indian business documents. "
            "Extract the invoice fields and return STRICT JSON only — no commentary, no markdown fences. "
            "Required keys: invoice_number (string), invoice_date (ISO YYYY-MM-DD or null), "
            "due_date (ISO YYYY-MM-DD or null), amount (number, base amount before tax in INR), "
            "tax_amount (number, GST/tax in INR; 0 if none), total_amount (number, INR), "
            "customer_business_name (string), description (short string). "
            "If a field is not found, use null or 0. Ignore currency symbols; output plain numbers."
        )
        prompt = (
            "Extract the invoice fields from this document and return only the JSON object."
        )

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id="invoice-ocr",
            system_message=system,
        ).with_model("gemini", "gemini-2.5-pro")

        file_attachment = FileContentWithMimeType(mime_type=mime_type, file_path=tmp_path)
        resp = await chat.send_message(UserMessage(text=prompt, file_contents=[file_attachment]))
        text = resp if isinstance(resp, str) else str(resp)

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            duration = round((time.time() - start) * 1000, 2)
            logger.warning(
                "Invoice OCR completed with no JSON in response",
                extra={"event": "ai.ocr.completed", "source": "gemini-2.5-pro", "result": "no_json", "duration_ms": duration},
            )
            return {"_source": "gemini-2.5-pro", "_error": "No JSON in response", "_raw": text[:500]}
        data = json.loads(match.group(0))
        data["_source"] = "gemini-2.5-pro"
        duration = round((time.time() - start) * 1000, 2)
        logger.info(
            "Invoice OCR completed successfully",
            extra={"event": "ai.ocr.completed", "source": "gemini-2.5-pro", "result": "success", "duration_ms": duration},
        )
        return data
    except Exception as e:
        duration = round((time.time() - start) * 1000, 2)
        logger.warning(
            f"Invoice OCR failed: {e}",
            extra={
                "event": "ai.ocr.failed",
                "error_type": type(e).__name__,
                "error_message": str(e),
                "duration_ms": duration,
            },
        )
        return {"_source": "gemini-2.5-pro", "_error": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


def _format_inr(amount: float) -> str:
    """Indian rupee formatting: 1,25,000 style."""
    try:
        amount = int(round(amount))
    except Exception:
        amount = 0
    s = str(abs(amount))
    if len(s) <= 3:
        formatted = s
    else:
        last3 = s[-3:]
        rest = s[:-3]
        rest_chunks = []
        while len(rest) > 2:
            rest_chunks.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            rest_chunks.insert(0, rest)
        formatted = ",".join(rest_chunks) + "," + last3
    sign = "-" if amount < 0 else ""
    return f"{sign}₹{formatted}"


def _overdue_days(due_date_iso: str) -> int:
    try:
        due = datetime.fromisoformat(due_date_iso.replace("Z", "+00:00"))
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - due).days
    except Exception:
        return 0


# ----------------- RISK SCORING (extracted helpers) -----------------
def _score_pending_amount(pending: float) -> tuple[int, str | None]:
    """Score risk based on pending amount. Returns (score_increment, reason or None)."""
    if pending >= 200000:
        return 25, f"high pending amount of {_format_inr(pending)}"
    if pending >= 100000:
        return 18, f"significant pending amount of {_format_inr(pending)}"
    if pending >= 50000:
        return 10, f"moderate pending amount of {_format_inr(pending)}"
    if pending > 0:
        return 4, None
    return 0, None


def _score_overdue_count(overdue_count: int) -> tuple[int, str | None]:
    """Score risk based on number of overdue invoices."""
    if overdue_count >= 3:
        return 20, f"{overdue_count} overdue invoices"
    if overdue_count == 2:
        return 14, "2 overdue invoices"
    if overdue_count == 1:
        return 8, "1 overdue invoice"
    return 0, None


def _score_avg_delay(avg_delay: int) -> tuple[int, str | None]:
    """Score risk based on average payment delay."""
    if avg_delay >= 30:
        return 20, f"average delay of {avg_delay} days"
    if avg_delay >= 15:
        return 12, f"average delay of {avg_delay} days"
    if avg_delay >= 7:
        return 6, None
    return 0, None


def _score_broken_promises(broken_promises: int) -> tuple[int, str | None]:
    """Score risk based on broken payment promises."""
    if broken_promises >= 2:
        return 18, f"{broken_promises} broken payment promises"
    if broken_promises == 1:
        return 10, "1 broken payment promise"
    return 0, None


def _score_ignored_followups(ignored: int) -> tuple[int, str | None]:
    """Score risk based on ignored follow-ups."""
    if ignored >= 3:
        return 10, f"{ignored} ignored follow-ups"
    if ignored > 0:
        return 5, None
    return 0, None


def _score_disputed(disputed: int) -> tuple[int, str | None]:
    """Score risk based on disputed invoices."""
    if disputed > 0:
        return 7, f"{disputed} disputed invoice(s)"
    return 0, None


def _score_credit_limit(credit_limit: float, pending: float) -> tuple[int, str | None]:
    """Score risk if pending exceeds credit limit."""
    if credit_limit > 0 and pending > credit_limit:
        return 10, "pending amount exceeds credit limit"
    return 0, None


def _risk_category_from_score(score: int) -> tuple[str, str]:
    """Map a numeric risk score to a category and recommended action."""
    if score <= 30:
        return "Low Risk", "Continue normal credit terms. Send routine reminders."
    if score <= 60:
        return "Medium Risk", "Monitor closely. Send timely follow-ups and confirm payment dates."
    if score <= 80:
        return "High Risk", "Require advance payment for new orders. Send firm reminders."
    return "Critical Risk", "Do not accept new orders without advance payment. Escalate immediately."


def compute_risk_score(stats: dict) -> dict:
    """Compute risk score 0-100 from customer stats."""
    pending = stats.get("total_pending", 0)
    overdue_count = stats.get("overdue_invoice_count", 0)
    avg_delay = stats.get("avg_delay_days", 0)
    broken_promises = stats.get("broken_promises", 0)
    ignored = stats.get("ignored_followups", 0)
    disputed = stats.get("disputed_count", 0)
    credit_limit = stats.get("credit_limit", 0) or 0

    score = 0
    reasons = []

    scorers = [
        lambda: _score_pending_amount(pending),
        lambda: _score_overdue_count(overdue_count),
        lambda: _score_avg_delay(avg_delay),
        lambda: _score_broken_promises(broken_promises),
        lambda: _score_ignored_followups(ignored),
        lambda: _score_disputed(disputed),
        lambda: _score_credit_limit(credit_limit, pending),
    ]

    for scorer in scorers:
        inc, reason = scorer()
        score += inc
        if reason:
            reasons.append(reason)

    score = max(0, min(100, score))
    category, action = _risk_category_from_score(score)

    if not reasons:
        reasons.append("clean payment history")

    reason_text = "Customer has " + ", ".join(reasons) + "."

    logger.info(
        "Risk score computed",
        extra={
            "event": "ai.risk_score.computed",
            "score": score,
            "category": category,
            "pending": pending,
            "overdue_count": overdue_count,
            "broken_promises": broken_promises,
        },
    )

    return {
        "risk_score": score,
        "risk_category": category,
        "risk_reason": reason_text,
        "risk_action": action,
    }


# ----------------- FOLLOW-UP GENERATION -----------------
def _greeting(name: str, tone: str) -> str:
    """Generate a culturally appropriate greeting based on tone."""
    if tone.lower() in ("polite", "friendly"):
        return f"Namaste {name} ji"
    if tone.lower() in ("strict", "final warning"):
        return f"Dear {name}"
    return f"Dear {name} ji"


def _followup_body_and_call(
    inv: str, amt: str, name: str, due: str, overdue_days: int,
) -> tuple[str, str]:
    """Generate the body text and call script based on overdue status."""
    if overdue_days < 0:
        body = (
            f"This is a gentle reminder that invoice {inv} of {amt} is due on {due}. "
            f"Kindly arrange the payment on time. Please confirm the expected payment date."
        )
        call = (
            f"Namaste {name} ji, just wanted to remind you that invoice {inv} for {amt} is due on {due}. "
            f"Could you please confirm if the payment will be made on time?"
        )
    elif overdue_days == 0:
        body = (
            f"Invoice {inv} of {amt} is due today ({due}). "
            f"Kindly process the payment today and share the UTR/reference number."
        )
        call = (
            f"Namaste {name} ji, invoice {inv} of {amt} is due today. "
            f"Can you please confirm when the payment will be processed?"
        )
    elif overdue_days <= 7:
        body = (
            f"As per our records, invoice {inv} of {amt} was due on {due} and is now {overdue_days} day(s) overdue. "
            f"Kindly process the payment at the earliest and share the payment confirmation."
        )
        call = (
            f"Namaste {name} ji, I am calling regarding invoice {inv} of {amt}, which was due on {due}. "
            f"It is now {overdue_days} day(s) overdue. Can you please confirm the payment timeline?"
        )
    elif overdue_days <= 15:
        body = (
            f"Invoice {inv} of {amt} was due on {due} and is now {overdue_days} days overdue. "
            f"Please process the payment immediately to avoid further follow-up. "
            f"Kindly confirm the exact payment date and share the UTR once paid."
        )
        call = (
            f"Namaste {name} ji, invoice {inv} of {amt} is {overdue_days} days overdue. "
            f"This is becoming a concern for our cashflow. Can you please clear the payment today or tomorrow?"
        )
    else:
        body = (
            f"Invoice {inv} of {amt} was due on {due} and is now {overdue_days} days overdue despite previous reminders. "
            f"This is a final reminder before we escalate the matter. "
            f"Please clear the outstanding amount within 48 hours."
        )
        call = (
            f"Dear {name}, invoice {inv} of {amt} is {overdue_days} days overdue. "
            f"We have already sent multiple reminders. Please confirm immediate payment to avoid escalation."
        )

    return body, call


def rule_based_followup(
    customer_name: str,
    invoice_number: str,
    amount: float,
    due_date: str,
    overdue_days: int,
    tone: str,
    message_type: str,
    business_name: str,
) -> dict:
    """Smart Indian-business-friendly rule-based fallback."""
    return rule_based_followup_from_config(FollowupConfig(
        customer_name=customer_name,
        invoice_number=invoice_number,
        amount=amount,
        due_date=due_date,
        overdue_days=overdue_days,
        tone=tone,
        message_type=message_type,
        business_name=business_name,
    ))


def rule_based_followup_from_config(cfg: FollowupConfig) -> dict:
    """Rule-based fallback using FollowupConfig dataclass."""
    pending = cfg.pending_amount if cfg.pending_amount > 0 else cfg.amount
    amt = _format_inr(pending)
    paid = _format_inr(cfg.paid_amount)
    name = cfg.customer_name or "Sir/Madam"
    inv = cfg.invoice_number
    due = cfg.due_date[:10] if cfg.due_date else ""

    greet = _greeting(name, cfg.tone)
    body, call = _followup_body_and_call(inv, amt, name, due, cfg.overdue_days)

    if cfg.paid_amount > 0:
        partial_note = f" You have already paid {paid}. The remaining pending amount is {amt}."
        body = body.replace(f"of {amt}", f"of {amt}") + partial_note
        call = call.replace(f"for {amt}", f"for {amt}") + f" The remaining balance is {amt}."

    closing = "Regards,\n" + cfg.business_name
    whatsapp = f"{greet}, {body.split('.')[0]}. Kindly confirm the payment timeline. — {cfg.business_name}"
    email_subject = f"Payment Reminder: Invoice {inv} of {amt} (pending)"
    email_body = f"{greet},\n\nI hope you are doing well. {body}\n\n{closing}"

    return {
        "whatsapp": whatsapp,
        "email_subject": email_subject,
        "email_body": email_body,
        "call_script": call,
        "message": email_body,
        "_source": "rule_based",
    }


def _build_followup_prompt(cfg: FollowupConfig, amt: str) -> str:
    """Build the LLM prompt for follow-up generation with payment history."""
    total = _format_inr(cfg.amount)
    paid = _format_inr(cfg.paid_amount)
    pending = _format_inr(cfg.pending_amount)

    lines = [
        f"Generate a {cfg.tone} {cfg.message_type} for the following Indian business invoice.",
        f"Business (sender): {cfg.business_name}",
        f"Customer (receiver): {cfg.customer_name}",
        f"Invoice Number: {cfg.invoice_number}",
        f"Invoice Status: {cfg.invoice_status}",
        f"Total Invoice Amount: {total}",
    ]

    if cfg.tax_amount > 0:
        lines.append(f"Tax (GST): {_format_inr(cfg.tax_amount)}")

    lines.append(f"Amount Already Paid: {paid}")
    lines.append(f"Amount Pending: {pending}")

    if cfg.payment_history:
        lines.append("")
        lines.append("Payment History (installments received):")
        for i, p in enumerate(cfg.payment_history, 1):
            pay_date = p.get("payment_date", "unknown date")[:10]
            pay_amt = _format_inr(p.get("amount", 0))
            pay_mode = p.get("payment_mode", "")
            pay_ref = p.get("reference_number", "")
            ref_part = f" (Ref: {pay_ref})" if pay_ref else ""
            lines.append(f"  - Installment {i}: {pay_amt} via {pay_mode} on {pay_date}{ref_part}")

    lines.extend([
        f"Due Date: {cfg.due_date[:10]}",
        f"Overdue Days: {cfg.overdue_days} (negative means not yet due)",
        f"Previous follow-ups already sent: {cfg.previous_followups}",
        f"Customer Risk Category: {cfg.risk_category}",
        "",
        "IMPORTANT: Reference the EXACT pending amount (not total) in all messages. "
        "If installments have been paid, acknowledge them and mention only the remaining balance.",
        "",
        "Return STRICT JSON only with these 4 keys: whatsapp, email_subject, email_body, call_script.",
    ])

    return "\n".join(lines)


def _parse_llm_followup_response(text: str, fallback: dict) -> dict | None:
    """Parse LLM JSON response for follow-up generation. Returns None on failure."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
        return {
            "whatsapp": data.get("whatsapp", fallback["whatsapp"]),
            "email_subject": data.get("email_subject", fallback["email_subject"]),
            "email_body": data.get("email_body", fallback["email_body"]),
            "call_script": data.get("call_script", fallback["call_script"]),
            "message": data.get("email_body", fallback["email_body"]),
            "_source": "claude-sonnet-4-6",
        }
    except (json.JSONDecodeError, KeyError):
        return None


async def generate_followup_ai(
    customer_name: str,
    invoice_number: str,
    amount: float,
    due_date: str,
    overdue_days: int,
    tone: str,
    message_type: str,
    business_name: str,
    previous_followups: int = 0,
    risk_category: str = "Low Risk",
    paid_amount: float = 0,
    pending_amount: float = 0,
    tax_amount: float = 0,
    invoice_status: str = "Sent",
    payment_history: list = None,
) -> dict:
    """Try LLM first; fall back to rule-based on any failure."""
    cfg = FollowupConfig(
        customer_name=customer_name,
        invoice_number=invoice_number,
        amount=amount,
        due_date=due_date,
        overdue_days=overdue_days,
        tone=tone,
        message_type=message_type,
        business_name=business_name,
        previous_followups=previous_followups,
        risk_category=risk_category,
        paid_amount=paid_amount,
        pending_amount=pending_amount,
        tax_amount=tax_amount,
        invoice_status=invoice_status,
        payment_history=payment_history or [],
    )
    return await generate_followup_ai_from_config(cfg)


async def generate_followup_ai_from_config(cfg: FollowupConfig) -> dict:
    """Try LLM first using FollowupConfig; fall back to rule-based on any failure."""
    logger.info(
        "Follow-up generation started",
        extra={
            "event": "ai.followup.started",
            "invoice_number": cfg.invoice_number,
            "customer_name": cfg.customer_name,
            "tone": cfg.tone,
            "message_type": cfg.message_type,
        },
    )

    fallback = rule_based_followup_from_config(cfg)

    if not EMERGENT_LLM_KEY:
        logger.info(
            "Follow-up generation using rule-based fallback (no API key)",
            extra={
                "event": "ai.followup.fallback_used",
                "reason": "no_api_key",
                "invoice_number": cfg.invoice_number,
            },
        )
        return fallback

    start = time.time()
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        system = (
            "You are an expert payment recovery assistant for Indian businesses (MSMEs, freelancers, agencies). "
            "Generate natural, professional, Indian-business-friendly payment follow-up messages. "
            "Use Indian style words like 'namaste', 'ji', 'kindly', 'as per our records' where the tone allows. "
            "Always include invoice number, EXACT PENDING amount in INR (₹), and due date. "
            "If installments have been paid, acknowledge them and mention only the remaining balance. "
            "Never reference the total invoice amount if partial payments have been made — use the pending amount. "
            "Always request payment confirmation (UTR/reference). Avoid robotic, overly aggressive, or rude language. "
            "Output STRICT JSON only with keys: whatsapp (short 1-3 lines), email_subject, email_body, call_script. No markdown."
        )

        amt = _format_inr(cfg.amount)
        prompt = _build_followup_prompt(cfg, amt)

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"followup-{cfg.invoice_number}",
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-6")

        resp = await chat.send_message(UserMessage(text=prompt))
        text = resp if isinstance(resp, str) else str(resp)

        result = _parse_llm_followup_response(text, fallback)
        duration = round((time.time() - start) * 1000, 2)
        if result:
            logger.info(
                "Follow-up generation completed via LLM",
                extra={
                    "event": "ai.followup.llm_success",
                    "source": "claude-sonnet-4-6",
                    "invoice_number": cfg.invoice_number,
                    "duration_ms": duration,
                },
            )
            return result
        else:
            logger.warning(
                "LLM response parsing failed, using rule-based fallback",
                extra={
                    "event": "ai.followup.fallback_used",
                    "reason": "parse_error",
                    "invoice_number": cfg.invoice_number,
                    "duration_ms": duration,
                },
            )
            return fallback
    except Exception as e:
        duration = round((time.time() - start) * 1000, 2)
        logger.warning(
            f"AI follow-up generation failed, using fallback: {e}",
            extra={
                "event": "ai.followup.fallback_used",
                "reason": "exception",
                "error_type": type(e).__name__,
                "error_message": str(e),
                "invoice_number": cfg.invoice_number,
                "duration_ms": duration,
            },
        )
        return fallback


# ----------------- RECOVERY REPORT -----------------
def build_recovery_report(
    customer_name: str,
    invoice_summary: list,
    risk_info: dict,
    business_name: str,
    total_pending: float,
    followup_count: int,
    broken_promises: int,
) -> str:
    """Builds a beautiful text report."""
    amt = _format_inr(total_pending)
    score = risk_info.get("risk_score", 0)
    category = risk_info.get("risk_category", "Low Risk")
    action = risk_info.get("risk_action", "")

    inv_lines = []
    for inv in invoice_summary:
        inv_lines.append(
            f"  • {inv.get('invoice_number')} — {_format_inr(inv.get('pending_amount', 0))} "
            f"({inv.get('status')}, overdue {inv.get('overdue_days', 0)}d)"
        )

    report = (
        f"PAYMENT RECOVERY REPORT\n"
        f"Generated by: {business_name}\n"
        f"Customer: {customer_name}\n"
        f"{'=' * 50}\n\n"
        f"SUMMARY\n"
        f"Total Pending Amount: {amt}\n"
        f"Follow-ups Sent: {followup_count}\n"
        f"Broken Promises: {broken_promises}\n"
        f"Risk Score: {score}/100\n"
        f"Risk Category: {category}\n\n"
        f"INVOICES\n" + ("\n".join(inv_lines) if inv_lines else "  No outstanding invoices") + "\n\n"
        f"AI SUMMARY\n"
        f"{customer_name} has a total pending payment of {amt} across {len(invoice_summary)} invoice(s). "
        f"The customer has received {followup_count} follow-up(s) and has {broken_promises} broken promise(s). "
        f"The risk score is {score}/100 ({category}). "
        f"\n\nRECOMMENDED ACTION\n{action}\n"
    )

    logger.info(
        "Recovery report generated",
        extra={
            "event": "ai.report.generated",
            "customer_name": customer_name,
            "invoice_count": len(invoice_summary),
            "risk_score": score,
            "risk_category": category,
            "total_pending": total_pending,
        },
    )

    return report
