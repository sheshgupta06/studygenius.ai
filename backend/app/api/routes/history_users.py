"""History + Users Routes"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, ActivityLog, Document
from app.models.schemas import ActivityLogResponse, UpdateProfileRequest, UserResponse, MessageOut

logger = logging.getLogger(__name__)
history_router = APIRouter()
users_router = APIRouter()


# ── History ────────────────────────────────────────────────────────────────────

@history_router.get("", response_model=list[ActivityLogResponse])
async def get_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ActivityLogResponse]:
    """Returns the user's activity log, most recent first."""
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(min(limit, 100))
    )
    logs = result.scalars().all()

    responses = []
    for log in logs:
        doc_title = None
        if log.document_id:
            doc_result = await db.execute(select(Document.title).where(Document.id == log.document_id))
            doc_title = doc_result.scalar_one_or_none()

        responses.append(ActivityLogResponse(
            id=str(log.id),
            document_id=str(log.document_id) if log.document_id else None,
            action=log.action,
            metadata=log.metadata_,
            created_at=log.created_at,
            document_title=doc_title,
        ))

    return responses


# ── Users / Profile ────────────────────────────────────────────────────────────

@users_router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Returns the current user's full profile."""
    return UserResponse.model_validate(current_user)


@users_router.patch("/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Updates the user's profile (name, avatar)."""
    if request.full_name is not None:
        current_user.full_name = request.full_name.strip()
    if request.avatar_url is not None:
        current_user.avatar_url = request.avatar_url

    await db.flush()
    return UserResponse.model_validate(current_user)


@users_router.delete("/account", response_model=MessageOut)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    """Deactivates the user account (soft delete)."""
    current_user.is_active = False
    await db.flush()
    return MessageOut(message="Account deactivated successfully.")
