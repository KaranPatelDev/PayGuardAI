"""PayGuard AI - Pydantic models."""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, ConfigDict
import uuid


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


# ---------- AUTH / USER ----------
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    business_name: str
    business_type: Optional[str] = ""
    gst_number: Optional[str] = ""
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = ""
    business_name: str
    business_type: Optional[str] = ""
    gst_number: Optional[str] = ""
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- CUSTOMER ----------
class CustomerBase(BaseModel):
    business_name: str
    contact_person: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    gst_number: Optional[str] = ""
    payment_terms: Optional[int] = 30
    credit_limit: Optional[float] = 0
    notes: Optional[str] = ""


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    business_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    gst_number: Optional[str] = None
    payment_terms: Optional[int] = None
    credit_limit: Optional[float] = None
    notes: Optional[str] = None


class Customer(CustomerBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    user_id: str
    risk_score: int = 0
    risk_category: str = "Low Risk"
    risk_reason: str = ""
    risk_action: str = ""
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- INVOICE ----------
class InvoiceBase(BaseModel):
    customer_id: str
    invoice_number: str
    invoice_date: str  # ISO date
    due_date: str  # ISO date
    amount: float
    tax_amount: float = 0
    payment_terms: Optional[int] = 30
    description: Optional[str] = ""


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    amount: Optional[float] = None
    tax_amount: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None


class Invoice(InvoiceBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    user_id: str
    total_amount: float = 0
    paid_amount: float = 0
    pending_amount: float = 0
    status: str = "Sent"
    file_url: Optional[str] = ""
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- PAYMENT ----------
class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_date: str
    payment_mode: str = "UPI"
    reference_number: Optional[str] = ""
    notes: Optional[str] = ""


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    invoice_id: str
    customer_id: str
    user_id: str
    amount: float
    payment_date: str
    payment_mode: str
    reference_number: Optional[str] = ""
    notes: Optional[str] = ""
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- FOLLOW-UP ----------
class FollowUpCreate(BaseModel):
    invoice_id: str
    followup_type: str
    message: str
    channel: str = "WhatsApp"
    tone: str = "Professional"
    status: str = "Drafted"
    email_subject: Optional[str] = ""
    email_body: Optional[str] = ""
    call_script: Optional[str] = ""
    promised_payment_date: Optional[str] = None
    customer_response: Optional[str] = ""


class FollowUpUpdate(BaseModel):
    status: Optional[str] = None
    customer_response: Optional[str] = None
    promised_payment_date: Optional[str] = None


class FollowUp(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    invoice_id: str
    customer_id: str
    user_id: str
    followup_type: str
    message: str
    email_subject: Optional[str] = ""
    email_body: Optional[str] = ""
    call_script: Optional[str] = ""
    channel: str
    tone: str
    status: str
    promised_payment_date: Optional[str] = None
    customer_response: Optional[str] = ""
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- AI REQUESTS ----------
class AIFollowupRequest(BaseModel):
    invoice_id: str
    tone: str = "Professional"
    message_type: str = "First overdue reminder"


class AIRiskRequest(BaseModel):
    customer_id: str


class AIReportRequest(BaseModel):
    customer_id: Optional[str] = None
    invoice_id: Optional[str] = None


# ---------- SETTINGS ----------
class BusinessSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    default_payment_terms: int = 30
    default_followup_tone: str = "Professional"
    default_reminder_days: List[int] = Field(default_factory=lambda: [-3, 0, 3, 7, 15, 30])
    reminder_channels: List[str] = Field(default_factory=lambda: ["WhatsApp", "Email"])
    currency: str = "INR"
    ai_provider: str = "claude-sonnet-4-6"
    updated_at: str = Field(default_factory=utcnow_iso)


class SettingsUpdate(BaseModel):
    default_payment_terms: Optional[int] = None
    default_followup_tone: Optional[str] = None
    default_reminder_days: Optional[List[int]] = None
    reminder_channels: Optional[List[str]] = None
    ai_provider: Optional[str] = None
