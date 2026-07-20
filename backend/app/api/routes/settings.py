from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.middlewares.dependencies import get_db, get_current_user
from app.models.schemas import SettingsUpdateRequest, SettingsResponse
from app.models.orm import User, Settings, utcnow

router = APIRouter()

@router.put("/", response_model=SettingsResponse)
async def update_settings(
    request: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Settings).where(Settings.user_id == current_user.id))
    settings = result.scalars().first()
    
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
    
    if request.theme is not None:
        settings.theme = request.theme
    if request.language is not None:
        settings.language = request.language
    if request.email_notifications is not None:
        settings.email_notifications = request.email_notifications
        
    await db.commit()
    await db.refresh(settings)
    
    return settings

@router.get("/", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Settings).where(Settings.user_id == current_user.id))
    settings = result.scalars().first()
    if not settings:
        settings = Settings(user_id=current_user.id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    return settings
