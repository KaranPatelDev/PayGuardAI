"""PayGuard AI - Request logging middleware and global exception handler."""
import logging
import time
import uuid
import traceback
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("payguard")
access_logger = logging.getLogger("payguard.access")


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every HTTP request and response with timing, status, and correlation ID."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = request_id

        start_time = time.time()
        client_ip = _get_client_ip(request)
        method = request.method
        path = request.url.path
        query = str(request.url.query) if request.url.query else ""

        access_logger.info(
            "Request started",
            extra={
                "event": "http.request",
                "request_id": request_id,
                "method": method,
                "path": path,
                "query": query,
                "client_ip": client_ip,
            },
        )

        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            response.headers["X-Request-ID"] = request_id
            return response
        except Exception as exc:
            status_code = 500
            raise
        finally:
            duration_ms = round((time.time() - start_time) * 1000, 2)

            extra = {
                "event": "http.response",
                "request_id": request_id,
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
                "client_ip": client_ip,
            }

            user_id = getattr(request.state, "user_id", None)
            if user_id:
                extra["user_id"] = user_id

            if status_code >= 500:
                access_logger.error("Request completed", extra=extra)
            elif status_code >= 400:
                access_logger.warning("Request completed", extra=extra)
            else:
                access_logger.info("Request completed", extra=extra)


def log_exception(
    exc: Exception,
    request: Request = None,
    user_id: str = None,
    context: dict = None,
) -> None:
    """Log an unhandled exception with full context."""
    extra = {
        "event": "exception.unhandled",
        "error_type": type(exc).__name__,
        "error_message": str(exc),
        "traceback": "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
    }

    if request:
        extra["method"] = request.method
        extra["path"] = str(request.url.path)
        extra["client_ip"] = _get_client_ip(request)
        request_id = getattr(request.state, "request_id", None)
        if request_id:
            extra["request_id"] = request_id

    if user_id:
        extra["user_id"] = user_id

    if context:
        extra["context"] = context

    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {exc}",
        extra=extra,
    )


def register_exception_handler(app: FastAPI) -> None:
    """Register a global exception handler on the FastAPI app."""

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        log_exception(exc, request=request)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
