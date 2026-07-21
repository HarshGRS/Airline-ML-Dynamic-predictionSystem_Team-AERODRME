import hashlib
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import limiter
from app.core.security import create_access_token, get_current_user, hash_password, verify_password
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.services.email import send_password_reset_email

RESET_TOKEN_EXPIRE_MINUTES = 30
GENERIC_FORGOT_PASSWORD_MESSAGE = (
    "If an account exists for that email, a password reset link has been sent."
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def signup(request: Request, payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(subject=user.email))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return TokenResponse(access_token=create_access_token(subject=user.email))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")
def google_login(request: Request, payload: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), settings.google_client_id
        )
        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            # Create a user with a random dummy password
            dummy_password = "".join(secrets.choice(string.ascii_letters + string.digits) for i in range(32))
            user = User(email=email, hashed_password=hash_password(dummy_password))
            db.add(user)
            db.commit()
            db.refresh(user)
            
        return TokenResponse(access_token=create_access_token(subject=user.email))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
def forgot_password(
    request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)
) -> MessageResponse:
    # Always return the same message whether or not the account exists —
    # otherwise this endpoint becomes a way to enumerate registered emails.
    user = db.query(User).filter(User.email == payload.email).first()
    if user is not None:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

        db.add(PasswordResetToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
        db.commit()

        reset_link = f"{settings.frontend_url}/reset-password?token={raw_token}"
        send_password_reset_email(user.email, reset_link)

    return MessageResponse(message=GENERIC_FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("10/minute")
def reset_password(
    request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)
) -> MessageResponse:
    token_hash = hashlib.sha256(payload.token.encode("utf-8")).hexdigest()
    reset_token = (
        db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()
    )

    now = datetime.now(timezone.utc)
    if (
        reset_token is None
        or reset_token.used
        or reset_token.expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link"
        )

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    user.hashed_password = hash_password(payload.new_password)
    reset_token.used = True
    db.commit()

    return MessageResponse(message="Password has been reset. You can now sign in.")
