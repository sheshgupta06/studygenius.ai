from sqlalchemy.orm import Session
from app.models.orm import Document
from app.models.orm import utcnow

class DocumentRepository:
    @staticmethod
    def get_by_id(db: Session, doc_id: str, user_id: str) -> Document | None:
        return db.query(Document).filter(
            Document.id == doc_id, 
            Document.user_id == user_id,
            Document.deleted_at == None
        ).first()

    @staticmethod
    def get_all_for_user(db: Session, user_id: str):
        return db.query(Document).filter(
            Document.user_id == user_id,
            Document.deleted_at == None
        ).order_by(Document.created_at.desc()).all()

    @staticmethod
    def create(db: Session, document: Document) -> Document:
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def delete(db: Session, doc_id: str, user_id: str) -> bool:
        """Soft delete the document."""
        doc = DocumentRepository.get_by_id(db, doc_id, user_id)
        if doc:
            doc.deleted_at = utcnow()
            db.commit()
            return True
        return False

    @staticmethod
    def update_title(db: Session, doc_id: str, user_id: str, new_title: str) -> Document | None:
        doc = DocumentRepository.get_by_id(db, doc_id, user_id)
        if doc:
            doc.title = new_title
            db.commit()
            db.refresh(doc)
        return doc
