"""History + Users Routes"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone

from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, ActivityLog, Document
from app.models.schemas import ActivityLogResponse, UpdateProfileRequest, UserResponse, MessageOut, DashboardStatsResponse, DashboardActivity

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


@users_router.get("/me/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardStatsResponse:
    """Returns real-time dashboard statistics based on the user's activity."""
    
    # 1. Docs Read (Total Unique Documents Uploaded)
    docs_result = await db.execute(select(func.count(Document.id)).where(Document.user_id == current_user.id))
    docs_read = docs_result.scalar() or 0

    # 2. Activity count for Learning Progress & Weekly Goal (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    activity_7d_result = await db.execute(
        select(func.count(ActivityLog.id))
        .where(and_(ActivityLog.user_id == current_user.id, ActivityLog.created_at >= seven_days_ago))
    )
    activity_7d_count = activity_7d_result.scalar() or 0
    
    # Target goal could be 20 activities per week.
    weekly_goal = min(int((activity_7d_count / 20.0) * 100), 100)
    learning_progress = weekly_goal  # Using same metric for progress

    # 3. Total activities for Study Time (estimate 15 mins per activity)
    total_activity_result = await db.execute(
        select(func.count(ActivityLog.id)).where(ActivityLog.user_id == current_user.id)
    )
    total_activities = total_activity_result.scalar() or 0
    study_time_hours = round((total_activities * 15) / 60.0, 1)

    # 4. Quiz Score (Estimate based on quiz generation counts, 20% per quiz, max 100)
    quizzes_result = await db.execute(
        select(func.count(ActivityLog.id))
        .where(and_(ActivityLog.user_id == current_user.id, ActivityLog.action == "generated_quiz"))
    )
    quizzes_count = quizzes_result.scalar() or 0
    quiz_score = min(quizzes_count * 20, 100)
    
    # 5. Day Streak
    streak_result = await db.execute(
        select(ActivityLog.created_at)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
    )
    all_dates = [log.date() for log in streak_result.scalars().all()]
    unique_dates = sorted(list(set(all_dates)), reverse=True)
    
    day_streak = 0
    today = datetime.now(timezone.utc).date()
    
    if unique_dates and unique_dates[0] == today:
        day_streak = 1
        current_date = today
        for d in unique_dates[1:]:
            if d == current_date - timedelta(days=1):
                day_streak += 1
                current_date = d
            else:
                break
    elif unique_dates and unique_dates[0] == today - timedelta(days=1):
        # They haven't done anything today, but streak from yesterday is kept active
        day_streak = 1
        current_date = today - timedelta(days=1)
        for d in unique_dates[1:]:
            if d == current_date - timedelta(days=1):
                day_streak += 1
                current_date = d
            else:
                break

    # 6. Recent Activities
    recent_result = await db.execute(
        select(ActivityLog, Document.title)
        .outerjoin(Document, ActivityLog.document_id == Document.id)
        .where(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(5)
    )
    
    recent_activities = []
    for log, doc_title in recent_result.all():
        recent_activities.append(DashboardActivity(
            id=log.id,
            action=log.action,
            created_at=log.created_at,
            document_title=doc_title
        ))

    return DashboardStatsResponse(
        learning_progress=learning_progress,
        weekly_goal=weekly_goal,
        docs_read=docs_read,
        quiz_score=quiz_score,
        study_time_hours=study_time_hours,
        day_streak=day_streak,
        recent_activities=recent_activities
    )


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
