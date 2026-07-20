"""
Auth Routes — Register, Login, Refresh Token, Get Current User
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import AsyncSessionLocal
from app.auth.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User
from app.models.schemas import (
    RegisterRequest, LoginRequest, AuthResponse,
    TokenResponse, AccessTokenResponse, UserResponse, MessageOut
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """
    Creates a new user account.
    Returns JWT access + refresh tokens immediately (no email verification for MVP).
    """
    # Check for existing email
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user with hashed password
    user = User(
        email=request.email.lower().strip(),
        full_name=request.full_name.strip(),
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    await db.flush()  # Get the generated UUID

    logger.info(f"New user registered: {user.email}")

    return AuthResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=create_refresh_token(str(user.id)),
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> AuthResponse:
    """
    Authenticates a user and returns JWT tokens.
    Uses constant-time bcrypt comparison to prevent timing attacks.
    """
    result = await db.execute(select(User).where(User.email == request.email.lower()))
    user = result.scalar_one_or_none()

    # Always verify password even if user not found (prevents user enumeration)
    dummy_hash = "$2b$12$invalidhashtopreventtimingattack"
    password_valid = verify_password(
        request.password,
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

    return AuthResponse(
        access_token=create_access_token(str(user.id), user.email),
        refresh_token=create_refresh_token(str(user.id)),
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


@router.post("/refresh-token", response_model=AccessTokenResponse)
async def refresh_access_token(
    authorization: str,
    db: AsyncSession = Depends(get_db),
) -> AccessTokenResponse:
    """
    Accepts a refresh token and returns a new access token.
    Client sends: { "authorization": "Bearer <refresh_token>" }
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authorization format.")

    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token, expected_type="refresh")
    user_id = payload["sub"]

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    return AccessTokenResponse(
        access_token=create_access_token(str(user.id), user.email),
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Returns the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
