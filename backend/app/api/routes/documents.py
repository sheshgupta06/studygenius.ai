"""
Documents Routes — Local file upload + RAG ingestion (no S3 needed for local dev).
"""

import logging
import uuid
import os
import aiofiles
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import get_settings
from app.middlewares.dependencies import get_db, get_current_user
from app.models.orm import User, Document, ActivityLog
from app.models.schemas import (
    CreateDocumentRequest, UpdateDocumentRequest, DocumentResponse,
    IngestResponse, DocumentStatus, MessageOut, DocumentRenameRequest
)
from app.rag.embeddings.pdf_processor import pdf_processor
from app.rag.embeddings.service import embeddings_service
from app.rag.vectorstore.chroma import chroma_store

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter()

# Local uploads directory inside the container
UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


async def _log_activity(db: AsyncSession, user_id, action: str, document_id=None, metadata: dict = None):
    log = ActivityLog(
        user_id=user_id if isinstance(user_id, uuid.UUID) else uuid.UUID(str(user_id)),
        action=action,
        document_id=(document_id if isinstance(document_id, uuid.UUID) else uuid.UUID(str(document_id))) if document_id else None,
        metadata_=metadata
    )
    db.add(log)


# ── Direct PDF Upload ──────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    """
    Accepts a PDF file directly, saves it locally, creates a DB record,
    and triggers RAG ingestion automatically.
    """
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save file locally
    file_id = str(uuid.uuid4())
    safe_name = f"{file_id}.pdf"
    file_path = UPLOADS_DIR / safe_name
    
    content = await file.read()
    file_size = len(content)

    if file_size > 52_428_800:  # 50MB
        raise HTTPException(status_code=400, detail="File size must be under 50MB.")

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Local URL served by the backend
    local_url = f"/api/v1/documents/file/{safe_name}"

    # Create document record
    document = Document(
        user_id=current_user.id,
        title=file.filename.replace(".pdf", "") if file.filename else "Untitled",
        original_name=file.filename or "document.pdf",
        s3_key=safe_name,          # Reusing s3_key field to store local filename
        s3_url=local_url,          # Local serve path
        file_size=file_size,
        status="processing",
    )
    db.add(document)
    
    # We MUST commit here so that the background task can find the document in the DB
    await db.commit()
    await db.refresh(document)

    doc_id = document.id
    await _log_activity(db, current_user.id, "uploaded", doc_id, {"title": document.title})
    await db.commit()

    # Trigger RAG ingestion in background using FastAPI's BackgroundTasks
    background_tasks.add_task(_ingest_document, str(doc_id), str(file_path), str(current_user.id))

    return DocumentResponse.model_validate(document)


async def _ingest_document(document_id: str, file_path: str, user_id: str):
    """Background task: chunk PDF → embed → store in ChromaDB."""
    try:
        from app.database.database import AsyncSessionLocal
        async with AsyncSessionLocal() as new_db:
            result = await new_db.execute(select(Document).where(Document.id == uuid.UUID(str(document_id))))
            doc = result.scalar_one_or_none()
            if not doc:
                logger.warning(f"Document {document_id} not found during ingestion")
                return

            chunks = await pdf_processor.process_pdf_local(file_path)
            texts = [chunk["content"] for chunk in chunks]
            embeddings = await embeddings_service.embed_batch(texts)
            chunk_count = chroma_store.store_chunks(document_id, chunks, embeddings)

            doc.status = "ready"
            doc.page_count = chunks[-1].get("page_number") if chunks else None
            doc.chroma_collection_id = f"doc_{document_id.replace('-', '_')}"

            log = ActivityLog(
                user_id=uuid.UUID(str(user_id)),
                document_id=uuid.UUID(str(document_id)),
                action="processed",
                metadata_={"chunks": chunk_count},
            )
            new_db.add(log)
            await new_db.commit()
            logger.info(f"Document {document_id} ingested: {chunk_count} chunks")

    except Exception as e:
        logger.error(f"Background ingestion failed for {document_id}: {e}", exc_info=True)
        try:
            from app.database.database import AsyncSessionLocal
            async with AsyncSessionLocal() as new_db:
                result = await new_db.execute(select(Document).where(Document.id == uuid.UUID(str(document_id))))
                doc = result.scalar_one_or_none()
                if doc:
                    doc.status = "failed"
                    await new_db.commit()
        except Exception:
            pass


# ── Serve local PDF files ──────────────────────────────────────────────────────

from fastapi.responses import FileResponse

@router.get("/file/{filename}")
async def serve_pdf(filename: str, current_user: User = Depends(get_current_user)):
    """Serves locally stored PDF files."""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=str(file_path), media_type="application/pdf")


# ── Document CRUD ─────────────────────────────────────────────────────────────

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    request: CreateDocumentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    """Legacy endpoint: creates document record after external upload."""
    document = Document(
        user_id=current_user.id,
        title=request.title,
        original_name=request.original_name,
        s3_key=request.s3_key,
        s3_url=request.s3_url,
        file_size=request.file_size,
        status="uploading",
    )
    db.add(document)
    await db.flush()
    await _log_activity(db, str(current_user.id), "uploaded", str(document.id), {"title": document.title})
    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentResponse]:
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return DocumentResponse.model_validate(doc)


@router.patch("/{document_id}/rename", response_model=DocumentResponse)
async def rename_document(
    document_id: uuid.UUID,
    request: DocumentRenameRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    doc.title = request.title
    await db.flush()
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", response_model=MessageOut)
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    chroma_store.delete_collection(str(document_id))

    # Delete local file
    try:
        file_path = UPLOADS_DIR / doc.s3_key
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        logger.warning(f"Local file delete failed: {e}")

    await db.delete(doc)
    return MessageOut(message="Document deleted successfully.")


# ── Ingestion (manual trigger) ─────────────────────────────────────────────────

@router.post("/{document_id}/ingest", response_model=IngestResponse)
async def ingest_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> IngestResponse:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    doc.status = "processing"
    await db.flush()

    try:
        file_path = str(UPLOADS_DIR / doc.s3_key)
        chunks = await pdf_processor.process_pdf_local(file_path)
        texts = [chunk["content"] for chunk in chunks]
        embeddings = await embeddings_service.embed_batch(texts)
        chunk_count = chroma_store.store_chunks(str(document_id), chunks, embeddings)

        doc.status = "ready"
        doc.chroma_collection_id = f"doc_{str(document_id).replace('-', '_')}"
        await _log_activity(db, str(current_user.id), "processed", str(document_id), {"chunks": chunk_count})
        await db.flush()

        return IngestResponse(
            document_id=str(document_id),
            status=DocumentStatus.READY,
            message=f"Ingestion complete. {chunk_count} chunks indexed.",
            chunk_count=chunk_count,
        )

    except Exception as e:
        logger.error(f"Ingestion failed for {document_id}: {e}", exc_info=True)
        doc.status = "failed"
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ingestion failed: {str(e)}",
        )
