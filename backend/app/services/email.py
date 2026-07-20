import logging

import httpx

from app.core.config import settings

logger = logging.getLogger("app")

BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Send the password-reset link via Brevo's transactional email API.

    Returns False (and logs) instead of raising on failure — callers must not
    let an email-provider outage reveal whether an account exists.
    """
    if not settings.brevo_api_key or not settings.brevo_sender_email:
        logger.warning("Brevo not configured — skipping password reset email to %s", to_email)
        return False

    payload = {
        "sender": {"name": "AERODROME", "email": settings.brevo_sender_email},
        "to": [{"email": to_email}],
        "subject": "Reset your AERODROME password",
        "htmlContent": (
            f"<p>We received a request to reset your AERODROME password.</p>"
            f'<p><a href="{reset_link}">Click here to choose a new password</a>. '
            f"This link expires in 30 minutes.</p>"
            f"<p>If you didn't request this, you can safely ignore this email.</p>"
        ),
    }
    headers = {
        "accept": "application/json",
        "api-key": settings.brevo_api_key,
        "content-type": "application/json",
    }

    try:
        response = httpx.post(BREVO_SEND_URL, json=payload, headers=headers, timeout=10.0)
        response.raise_for_status()
        return True
    except httpx.HTTPError:
        logger.exception("Failed to send password reset email to %s", to_email)
        return False
