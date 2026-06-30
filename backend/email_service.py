"""PayGuard AI - Email service via Gmail SMTP."""
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from logging_config import get_logger

logger = get_logger("payguard.email")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _build_reset_email(user_name: str, reset_url: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"] = f"PayGuard AI <{SMTP_USER}>"
    msg["Subject"] = "Reset your PayGuard AI password"

    text_body = (
        f"Namaste {user_name},\n\n"
        f"You requested a password reset for your PayGuard AI account.\n\n"
        f"Click the link below to reset your password:\n{reset_url}\n\n"
        f"This link will expire in 15 minutes.\n\n"
        f"If you did not request this, you can safely ignore this email.\n\n"
        f" Regards,\nPayGuard AI Team"
    )

    html_body = f"""\
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#0A3B2C;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.02em;">
                &#x1F6E1; PayGuard AI
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:18px;font-weight:600;">
                Reset your password
              </h2>
              <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
                Namaste {user_name},
              </p>
              <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
                We received a request to reset the password for your PayGuard AI account.
                Click the button below to set a new password.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="{reset_url}"
                       style="display:inline-block;background-color:#0A3B2C;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;">
                This link will expire in <strong>15 minutes</strong>.
              </p>
              <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.5;text-align:center;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:11px;">
                &copy; 2026 PayGuard AI &mdash; Recover faster. Build calmer.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


async def send_password_reset_email(to_email: str, user_name: str, token: str) -> bool:
    if not SMTP_USER or not SMTP_PASS or SMTP_USER == "your_gmail@gmail.com":
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        logger.warning(
            "SMTP not configured — printing reset link to console",
            extra={"event": "email.smtp_not_configured", "reset_url": reset_url},
        )
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET LINK (SMTP not configured):")
        print(f"Email: {to_email}")
        print(f"Link:  {reset_url}")
        print(f"{'='*60}\n")
        return True

    try:
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        msg = _build_reset_email(user_name, reset_url)
        msg["To"] = to_email

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        logger.info(
            "Password reset email sent",
            extra={"event": "email.password_reset_sent", "to": to_email},
        )
        return True
    except Exception as exc:
        logger.error(
            "Failed to send password reset email",
            extra={"event": "email.password_reset_failed", "to": to_email, "error": str(exc)},
        )
        return False


def _build_followup_email(customer_name: str, subject: str, body: str, business_name: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{business_name} via PayGuard AI <{SMTP_USER}>"
    msg["Subject"] = subject

    html_body = f"""\
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F9FAFB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden;">
          <tr>
            <td style="background-color:#0A3B2C;padding:20px 28px;">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:600;">
                {business_name}
              </h1>
              <p style="margin:4px 0 0;color:#A7F3D0;font-size:12px;">Payment Follow-up via PayGuard AI</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.7;">
                {body}
              </p>
              <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">
                Regards,<br/>{business_name}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:11px;">
                Sent via PayGuard AI &mdash; AI-powered payment recovery for Indian MSMEs.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    msg.attach(MIMEText(body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


async def send_followup_email(
    to_email: str, customer_name: str, subject: str, body: str, business_name: str
) -> bool:
    if not SMTP_USER or not SMTP_PASS or SMTP_USER == "your_gmail@gmail.com":
        logger.warning(
            "SMTP not configured — cannot send follow-up email",
            extra={"event": "email.followup.smtp_not_configured", "to": to_email},
        )
        return False

    try:
        msg = _build_followup_email(customer_name, subject, body, business_name)
        msg["To"] = to_email

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASS,
        )
        logger.info(
            "Follow-up email sent",
            extra={"event": "email.followup_sent", "to": to_email, "customer": customer_name},
        )
        return True
    except Exception as exc:
        logger.error(
            "Failed to send follow-up email",
            extra={"event": "email.followup_failed", "to": to_email, "error": str(exc)},
        )
        return False
