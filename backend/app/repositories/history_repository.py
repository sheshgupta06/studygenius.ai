from sqlalchemy.orm import Session
from app.models.orm import ActivityLog
from app.models.orm import utcnow

class HistoryRepository:
    @staticmethod
    def get_user_history(db: Session, user_id: str, limit: int = 50):
        return db.query(ActivityLog).filter(
            ActivityLog.user_id == user_id,
            ActivityLog.deleted_at == None
        ).order_by(ActivityLog.created_at.desc()).limit(limit).all()

    @staticmethod
    def create(db: Session, user_id: str, action: str, document_id: str = None) -> ActivityLog:
        history = ActivityLog(
            user_id=user_id,
            action=action,
            document_id=document_id
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history
