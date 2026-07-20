from sqlalchemy.orm import Session
from app.models.orm import User
from app.models.schemas import UserCreate
from app.auth.security import get_password_hash
from app.models.orm import utcnow

class UserRepository:
    @staticmethod
    def get_by_email(db: Session, email: str) -> User | None:
        return db.query(User).filter(User.email == email, User.deleted_at == None).first()

    @staticmethod
    def get_by_id(db: Session, user_id: str) -> User | None:
        return db.query(User).filter(User.id == user_id, User.deleted_at == None).first()

    @staticmethod
    def create(db: Session, user_in: UserCreate) -> User:
        db_user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete(db: Session, user_id: str) -> bool:
        """Soft delete the user."""
        user = UserRepository.get_by_id(db, user_id)
        if user:
            user.deleted_at = utcnow()
            db.commit()
            return True
        return False

    @staticmethod
    def update_name(db: Session, user_id: str, new_name: str) -> User | None:
        user = UserRepository.get_by_id(db, user_id)
        if user:
            user.full_name = new_name
            db.commit()
            db.refresh(user)
        return user
