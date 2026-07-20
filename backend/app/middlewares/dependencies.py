"""
FastAPI Dependencies — Reusable dependency injection functions.
"""

import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator
from sqlalchemy import select
import uuid

from app.database.database import AsyncSessionLocal
from app.auth.security import decode_token
from app.models.orm import User

logger = logging.getLogger(__name__)

# Bearer token extractor — reads "Authorization: Bearer <token>" header
bearer_scheme = HTTPBearer(auto_error=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a database session for each request.
    Commits on success, rolls back on exception, always closes.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Extracts and validates the JWT access token from the Authorization header.
    Fetches the corresponding user from the database.

    Raises HTTP 401 if:
    - Token is missing, malformed, or expired
    - Token type is not "access"
    - User no longer exists in the database

    Usage:
        @router.get("/protected")
        async def protected(user: User = Depends(get_current_user)):
            ...
    """
    # Decode and validate JWT
    payload = decode_token(credentials.credentials, expected_type="access")
    user_id: str = payload["sub"]

    # Convert UUID strings to actual UUID objects for UUID columns
    try:
        user_id = uuid.UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Optional auth — returns user if token present, None otherwise."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
