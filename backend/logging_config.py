"""PayGuard AI - Centralized structured JSON logging configuration."""
import json
import logging
import logging.handlers
import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path

SENSITIVE_KEYS = {
    "password", "password_hash", "hashed_password",
    "token", "access_token", "jwt_token",
    "authorization", "api_key", "secret",
    "jwt_secret", "emergent_llm_key",
    "credit_card", "card_number", "cvv", "otp",
}

ROOT_DIR = Path(__file__).parent

STANDARD_LOG_RECORD_KEYS = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message",
}


class SensitiveFilter(logging.Filter):
    """Automatically redact sensitive fields from log records."""

    def filter(self, record: logging.LogRecord) -> bool:
        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            record.extra_data = _redact_dict(record.extra_data)
        msg = record.getMessage()
        if any(kw in msg.lower() for kw in ("password", "token", "secret", "api_key")):
            record.msg = _redact_string(record.msg)
        return True


def _redact_dict(d: dict) -> dict:
    redacted = {}
    for k, v in d.items():
        if k.lower() in SENSITIVE_KEYS:
            redacted[k] = "[REDACTED]"
        elif isinstance(v, dict):
            redacted[k] = _redact_dict(v)
        else:
            redacted[k] = v
    return redacted


def _redact_string(text: str) -> str:
    import re
    for pattern in [
        r'(?i)(password["\s:=]+)\S+',
        r'(?i)(token["\s:=]+)\S+',
        r'(?i)(api_key["\s:=]+)\S+',
        r'(?i)(secret["\s:=]+)\S+',
        r'(?i)(authorization["\s:=]+Bearer\s+)\S+',
    ]:
        text = re.sub(pattern, r'\g<1>[REDACTED]', text)
    return text


class JSONFormatter(logging.Formatter):
    """Outputs one JSON object per log line with structured fields."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "service": "payguard",
            "module": record.module,
            "function": record.funcName,
            "message": record.getMessage(),
        }

        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        if hasattr(record, "event"):
            log_entry["event"] = record.event
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        if hasattr(record, "path"):
            log_entry["path"] = record.path
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = record.duration_ms
        if hasattr(record, "client_ip"):
            log_entry["client_ip"] = record.client_ip
        if hasattr(record, "error_type"):
            log_entry["error_type"] = record.error_type
        if hasattr(record, "error_message"):
            log_entry["error_message"] = record.error_message
        if hasattr(record, "context"):
            log_entry["context"] = record.context

        if hasattr(record, "extra_data") and isinstance(record.extra_data, dict):
            log_entry["data"] = _redact_dict(record.extra_data)

        known_extra_keys = {
            "request_id", "user_id", "event", "method", "path", "status_code",
            "duration_ms", "client_ip", "error_type", "error_message",
            "context", "extra_data", "traceback",
        }
        extra_data = log_entry.get("data", {})
        for key, value in record.__dict__.items():
            if key in STANDARD_LOG_RECORD_KEYS or key in known_extra_keys or key.startswith("_"):
                continue
            extra_data[key] = value
        if extra_data:
            log_entry["data"] = _redact_dict(extra_data)

        tb = getattr(record, "traceback", None)
        if tb:
            log_entry["traceback"] = tb

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["error"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]) if record.exc_info[1] else "",
                "traceback": "".join(traceback.format_exception(*record.exc_info)),
            }

        return json.dumps(log_entry, default=str, ensure_ascii=False)


def setup_logging(
    log_dir: str = None,
    log_level: str = None,
) -> None:
    """Configure centralized structured logging with rotation.

    Creates three log files under log_dir:
      - app.log   — general application logs (INFO+)
      - error.log — error logs only (ERROR+)
      - access.log — HTTP access/request logs (INFO+)
    """
    if log_dir is None:
        log_dir = os.environ.get("LOG_DIR", "./logs")
    if log_level is None:
        log_level = os.environ.get("LOG_LEVEL", "INFO")

    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    root_logger = logging.getLogger("payguard")
    root_logger.setLevel(numeric_level)
    root_logger.handlers.clear()

    sensitive_filter = SensitiveFilter()

    json_formatter = JSONFormatter()

    # --- App log handler (general) ---
    app_handler = logging.handlers.RotatingFileHandler(
        log_path / "app.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    app_handler.setLevel(numeric_level)
    app_handler.setFormatter(json_formatter)
    app_handler.addFilter(sensitive_filter)

    # --- Error log handler ---
    error_handler = logging.handlers.RotatingFileHandler(
        log_path / "error.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(json_formatter)
    error_handler.addFilter(sensitive_filter)

    # --- Access log handler ---
    access_logger = logging.getLogger("payguard.access")
    access_logger.setLevel(numeric_level)
    access_logger.handlers.clear()
    access_logger.propagate = False

    access_handler = logging.handlers.RotatingFileHandler(
        log_path / "access.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    access_handler.setLevel(numeric_level)
    access_handler.setFormatter(json_formatter)
    access_handler.addFilter(sensitive_filter)
    access_logger.addHandler(access_handler)

    # --- Console handler (development) ---
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(json_formatter)
    console_handler.addFilter(sensitive_filter)

    root_logger.addHandler(app_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)


def get_logger(name: str = "payguard") -> logging.Logger:
    """Get a child logger under the payguard namespace."""
    return logging.getLogger(name)
