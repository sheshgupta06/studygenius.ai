"""
JWT Security Module — StudyGenius AI
Handles password hashing (bcrypt) and JWT token creation/verification.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, status

from app.config.settings import get_settings

settings = get_settings()

# ── Password Hashing ──────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hashes a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    pwd_bytes = plain_password.encode('utf-8')
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


# ── JWT Token Creation ────────────────────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> str:
    """
    Creates a short-lived JWT access token (default: 15 minutes).
    Payload: sub (user_id), email, type, iat, exp, jti
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),   # Unique token ID for future revocation support
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str, jti: Optional[str] = None) -> str:
    """
    Creates a long-lived JWT refresh token (default: 7 days).
    Used only to obtain a new access token — minimal payload.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    token_jti = jti if jti is not None else str(uuid.uuid4())

    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": expire,
        "jti": token_jti,
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── JWT Token Verification ────────────────────────────────────────────────────

def decode_token(token: str, expected_type: str = "access") -> dict:
    """
    Decodes and validates a JWT token.
    Raises HTTP 401 on any validation failure — never leaks token details.

    Args:
        token: The raw JWT string.
        expected_type: "access" or "refresh" — prevents token type confusion attacks.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        # Verify token type to prevent refresh token being used as access token
        if payload.get("type") != expected_type:
            raise credentials_exception

        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception
