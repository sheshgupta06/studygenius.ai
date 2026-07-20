from sqlalchemy.orm import Session
from app.models.orm import Note, Summary, Quiz, Flashcard
from app.models.orm import utcnow
from typing import TypeVar, Type

ModelType = TypeVar("ModelType", Note, Summary, Quiz, Flashcard)

class ContentRepository:
    @staticmethod
    def _get_model_class(gen_type: str) -> Type[ModelType]:
        models = {
            "notes": Note,
            "summary": Summary,
            "quiz": Quiz,
            "flashcards": Flashcard
        }
        if gen_type not in models:
            raise ValueError(f"Unknown generation type: {gen_type}")
        return models[gen_type]

    @staticmethod
    def get_by_document(db: Session, doc_id: str, user_id: str, gen_type: str):
        model = ContentRepository._get_model_class(gen_type)
        return db.query(model).filter(
            model.document_id == doc_id,
            model.user_id == user_id,
            model.deleted_at == None
        ).first()

    @staticmethod
    def create_or_update(db: Session, user_id: str, document_id: str, gen_type: str, content: dict):
        model = ContentRepository._get_model_class(gen_type)
        existing = ContentRepository.get_by_document(db, document_id, user_id, gen_type)
        
        if existing:
            existing.content = content
            db.commit()
            db.refresh(existing)
            return existing
            
        # For new record
        new_record = model(
            document_id=document_id,
            user_id=user_id,
            content=content
        )
        # Handle title if the model is Note
        if gen_type == "notes" and "title" in content:
            new_record.title = content["title"]

        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return new_record
