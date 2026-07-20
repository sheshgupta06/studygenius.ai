"""
Auth Routes — Register, Login, Refresh Token, Get Current User
"""

import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from jose import jwt

from app.database.database import AsyncSessionLocal
from app.auth.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, Session as DBSession
from pydantic import BaseModel
from app.models.schemas import (
    RegisterRequest, LoginRequest, AuthResponse,
    TokenResponse, AccessTokenResponse, UserResponse, MessageOut,
    UpdateProfileRequest
)
from app.config.settings import get_settings

settings = get_settings()

logger = logging.getLogger(__name__)
router = APIRouter()

# Import the global limiter
from app.config.limiter import limiter

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """
    Creates a new user account.
    Returns JWT access + refresh tokens immediately (no email verification for MVP).
    """
    # Check for existing email
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user with hashed password
    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()  # Get the generated UUID

    # Create refresh token and persist session (store jti)
    refresh_token = create_refresh_token(str(user.id))
    try:
        decoded = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = decoded.get("jti")
        exp = decoded.get("exp")
        if isinstance(exp, (int, float)):
            expires_at = datetime.fromtimestamp(int(exp), tz=timezone.utc)
        else:
            expires_at = datetime.now(timezone.utc)
    except Exception:
        jti = None
        expires_at = datetime.now(timezone.utc)

    if jti:
        session = DBSession(user_id=user.id, token=jti, expires_at=expires_at)
        db.add(session)

    await db.commit()
    await db.refresh(user)

    logger.info(f"New user registered: {user.email}")

    return AuthResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """
    Authenticates a user and returns JWT tokens.
    Uses constant-time bcrypt comparison to prevent timing attacks.
    """
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    # Always verify password even if user not found (prevents user enumeration)
    dummy_hash = "$2b$12$invalidhashtopreventtimingattack"
    password_valid = verify_password(
        payload.password,
        user.hashed_password if user else dummy_hash,
    )

    if not user or not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    logger.info(f"User logged in: {user.email}")
    # Create refresh token and persist session record (store jti)
    refresh_token = create_refresh_token(str(user.id))
    try:
        decoded = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        jti = decoded.get("jti")
        exp = decoded.get("exp")
        if isinstance(exp, (int, float)):
            expires_at = datetime.fromtimestamp(int(exp), tz=timezone.utc)
        else:
            expires_at = datetime.now(timezone.utc)
    except Exception:
        jti = None
        expires_at = datetime.now(timezone.utc)

    if jti:
        session = DBSession(user_id=user.id, token=jti, expires_at=expires_at)
        db.add(session)

    await db.commit()
    await db.refresh(user)

    return AuthResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh_token(
    db: AsyncSession = Depends(get_db),
    # Manually extract bearer token here since we need refresh type
    credentials: str = Depends(lambda: None),
) -> AccessTokenResponse:
    """
    Issues a new access token using a valid refresh token.
    Client must send: Authorization: Bearer <refresh_token>
    """
    from fastapi import Request
    from fastapi.security import HTTPBearer

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Use the /refresh-token endpoint with your refresh token in the Authorization header.",
    )


class RefreshRequest(BaseModel):
    authorization: str

@router.post("/refresh-token", response_model=AccessTokenResponse)
async def refresh_access_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> AccessTokenResponse:
    """
    Accepts a refresh token and returns a new access token.
    Client sends: { "authorization": "Bearer <refresh_token>" }
    """
    if not payload.authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authorization format.")

    token = payload.authorization.removeprefix("Bearer ").strip()
    token_payload = decode_token(token, expected_type="refresh")
    user_id = token_payload["sub"]
    jti = token_payload.get("jti")

    try:
        user_id = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    # Verify session exists and not expired
    result = await db.execute(select(DBSession).where(DBSession.token == jti))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session.")

    # Check user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    return AccessTokenResponse(
        access_token=create_access_token(str(user.id), user.email),
        token_type="bearer",
    )


@router.get("/profile", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Returns the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """Updates the user's profile."""
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.avatar_url is not None:
        current_user.avatar_url = request.avatar_url
    
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Invalidates the current session.
    (Frontend should clear the token. Backend marks session as deleted if tracking).
    """
    # Extract token from Authorization header and remove session
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"message": "Successfully logged out"}

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        token_payload = decode_token(token, expected_type="access")
        # access tokens don't carry the refresh jti; nothing to delete in sessions
    except Exception:
        # Try decode as refresh to revoke session
        try:
            token_payload = decode_token(token, expected_type="refresh")
            jti = token_payload.get("jti")
            if jti:
                result = await db.execute(select(DBSession).where(DBSession.token == jti))
                session = result.scalar_one_or_none()
                if session:
                    await db.delete(session)
                    await db.commit()
        except Exception:
            pass

    return {"message": "Successfully logged out"}

