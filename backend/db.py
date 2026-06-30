"""PayGuard AI - PostgreSQL database (SQLAlchemy async + asyncpg)."""
import os
import time
import ssl
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Text, JSON, ForeignKey, text
import json

from logging_config import get_logger

logger = get_logger("payguard.db")


def _clean_database_url(url: str) -> str:
    """Strip non-asyncpg params (sslmode, channel_binding) from Neon URLs."""
    parsed = urlparse(url)
    params = parse_qs(parsed.query)
    clean_params = {k: v[0] for k, v in params.items() if k not in ("sslmode", "channel_binding")}
    clean_query = urlencode(clean_params) if clean_params else ""
    return urlunparse(parsed._replace(query=clean_query))


DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/payguard_ai")
DATABASE_URL = _clean_database_url(DATABASE_URL)

connect_args = {}
if "neon.tech" in DATABASE_URL:
    connect_args["ssl"] = True

engine = create_async_engine(
    DATABASE_URL, echo=False, pool_size=10, max_overflow=20,
    connect_args=connect_args,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String, default="")
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    business_type: Mapped[str] = mapped_column(String, default="")
    gst_number: Mapped[str] = mapped_column(String, default="")
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    business_name: Mapped[str] = mapped_column(String, nullable=False)
    contact_person: Mapped[str] = mapped_column(String, default="")
    email: Mapped[str] = mapped_column(String, default="")
    phone: Mapped[str] = mapped_column(String, default="")
    address: Mapped[str] = mapped_column(String, default="")
    city: Mapped[str] = mapped_column(String, default="")
    state: Mapped[str] = mapped_column(String, default="")
    gst_number: Mapped[str] = mapped_column(String, default="")
    payment_terms: Mapped[int] = mapped_column(Integer, default=30)
    credit_limit: Mapped[float] = mapped_column(Float, default=0)
    notes: Mapped[str] = mapped_column(String, default="")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_category: Mapped[str] = mapped_column(String, default="Low Risk")
    risk_reason: Mapped[str] = mapped_column(String, default="")
    risk_action: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False, index=True)
    invoice_number: Mapped[str] = mapped_column(String, nullable=False)
    invoice_date: Mapped[str] = mapped_column(String, nullable=False)
    due_date: Mapped[str] = mapped_column(String, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    tax_amount: Mapped[float] = mapped_column(Float, default=0)
    total_amount: Mapped[float] = mapped_column(Float, default=0)
    paid_amount: Mapped[float] = mapped_column(Float, default=0)
    pending_amount: Mapped[float] = mapped_column(Float, default=0)
    payment_terms: Mapped[int] = mapped_column(Integer, default=30)
    description: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="Sent")
    file_url: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[str] = mapped_column(String, nullable=False)
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    invoice_id: Mapped[str] = mapped_column(String, ForeignKey("invoices.id"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_date: Mapped[str] = mapped_column(String, nullable=False)
    payment_mode: Mapped[str] = mapped_column(String, default="UPI")
    reference_number: Mapped[str] = mapped_column(String, default="")
    notes: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[str] = mapped_column(String, nullable=False)


class Followup(Base):
    __tablename__ = "followups"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    invoice_id: Mapped[str] = mapped_column(String, ForeignKey("invoices.id"), nullable=False, index=True)
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False, index=True)
    followup_type: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    email_subject: Mapped[str] = mapped_column(String, default="")
    email_body: Mapped[str] = mapped_column(Text, default="")
    call_script: Mapped[str] = mapped_column(Text, default="")
    channel: Mapped[str] = mapped_column(String, default="WhatsApp")
    tone: Mapped[str] = mapped_column(String, default="Professional")
    status: Mapped[str] = mapped_column(String, default="Drafted")
    promised_payment_date: Mapped[str] = mapped_column(String, nullable=True, default=None)
    customer_response: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[str] = mapped_column(String, nullable=False)


class Settings(Base):
    __tablename__ = "settings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    default_payment_terms: Mapped[int] = mapped_column(Integer, default=30)
    default_followup_tone: Mapped[str] = mapped_column(String, default="Professional")
    default_reminder_days: Mapped[str] = mapped_column(Text, default="[-3, 0, 3, 7, 15, 30]")
    reminder_channels: Mapped[str] = mapped_column(Text, default='["WhatsApp", "Email"]')
    currency: Mapped[str] = mapped_column(String, default="INR")
    ai_provider: Mapped[str] = mapped_column(String, default="claude-sonnet-4-6")
    updated_at: Mapped[str] = mapped_column(String, nullable=False)


async def init_db():
    logger.info("Database initialization started", extra={"event": "db.init.started"})
    start = time.time()
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        duration = round((time.time() - start) * 1000, 2)
        logger.info(
            "Database initialization completed",
            extra={"event": "db.init.completed", "duration_ms": duration},
        )
    except Exception as exc:
        duration = round((time.time() - start) * 1000, 2)
        logger.error(
            f"Database initialization failed: {exc}",
            extra={"event": "db.init.failed", "duration_ms": duration},
        )
        raise


async def close_db():
    logger.info("Database connection closing", extra={"event": "db.close.started"})
    try:
        await engine.dispose()
        logger.info("Database connection closed", extra={"event": "db.close.completed"})
    except Exception as exc:
        logger.error(
            f"Database close failed: {exc}",
            extra={"event": "db.close.failed"},
        )


async def get_session():
    async with async_session() as session:
        yield session
