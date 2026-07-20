"""
Vector Store Service
Manages pgvector operations: storing, searching, and deleting embeddings.
"""

import logging
import uuid
from sqlalchemy import text, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import get_settings
from app.models.database import DocumentChunk
from app.models.schemas import SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()


class VectorStoreService:
    """
    Handles all pgvector interactions:
    - Storing embeddings for document chunks
    - Semantic similarity search (cosine distance)
    - Hybrid search combining vector + keyword (BM25-like)
    - Deleting embeddings when a document is removed
    """

    async def store_chunks(
        self,
        db: AsyncSession,
        document_id: str,
        chunks: list[dict],
        embeddings: list[list[float]],
    ) -> int:
        """
        Stores a batch of document chunks with their embeddings into pgvector.
        Returns the number of chunks stored.
        """
        if len(chunks) != len(embeddings):
            raise ValueError(f"Chunk/embedding count mismatch: {len(chunks)} vs {len(embeddings)}")

        chunk_objects = []
        for chunk, embedding in zip(chunks, embeddings):
            chunk_obj = DocumentChunk(
                id=uuid.uuid4(),
                document_id=document_id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                metadata=chunk.get("metadata", {}),
                embedding=embedding,
            )
            chunk_objects.append(chunk_obj)

        db.add_all(chunk_objects)
        await db.flush()  # Flush to DB without committing (commit happens in session lifecycle)

        logger.info(f"Stored {len(chunk_objects)} chunks for document {document_id}")
        return len(chunk_objects)

    async def similarity_search(
        self,
        db: AsyncSession,
        document_id: str,
        query_embedding: list[float],
        top_k: int = None,
        score_threshold: float = None,
    ) -> list[SourceChunk]:
        """
        Performs cosine similarity search in pgvector.
        Returns the top-K most relevant chunks for the query.
        """
        top_k = top_k or settings.RETRIEVAL_TOP_K
        score_threshold = score_threshold or settings.RETRIEVAL_SCORE_THRESHOLD

        # pgvector cosine distance: 1 - cosine_similarity
        # Lower distance = more similar
        query = text("""
            SELECT
                id::text,
                content,
                metadata,
                1 - (embedding <=> :query_embedding::vector) AS similarity_score
            FROM document_chunks
            WHERE document_id = :document_id
              AND embedding IS NOT NULL
              AND 1 - (embedding <=> :query_embedding::vector) >= :threshold
            ORDER BY embedding <=> :query_embedding::vector
            LIMIT :top_k
        """)

        result = await db.execute(
            query,
            {
                "query_embedding": str(query_embedding),
                "document_id": str(document_id),
                "threshold": score_threshold,
                "top_k": top_k,
            },
        )
        rows = result.fetchall()

        source_chunks = []
        for row in rows:
            metadata = row.metadata or {}
            source_chunks.append(
                SourceChunk(
                    chunk_id=row.id,
                    content=row.content,
                    page_number=metadata.get("page_number"),
                    score=round(float(row.similarity_score), 4),
                )
            )

        logger.info(f"Found {len(source_chunks)} relevant chunks for document {document_id}")
        return source_chunks

    async def keyword_search(
        self,
        db: AsyncSession,
        document_id: str,
        query: str,
        top_k: int = 3,
    ) -> list[SourceChunk]:
        """
        PostgreSQL full-text search (tsvector/tsquery) for keyword-based retrieval.
        Used in hybrid search to complement semantic search.
        """
        sql = text("""
            SELECT
                id::text,
                content,
                metadata,
                ts_rank(to_tsvector('english', content), plainto_tsquery('english', :query)) AS rank
            FROM document_chunks
            WHERE document_id = :document_id
              AND to_tsvector('english', content) @@ plainto_tsquery('english', :query)
            ORDER BY rank DESC
            LIMIT :top_k
        """)

        result = await db.execute(
            sql,
            {"query": query, "document_id": str(document_id), "top_k": top_k},
        )
        rows = result.fetchall()

        return [
            SourceChunk(
                chunk_id=row.id,
                content=row.content,
                page_number=(row.metadata or {}).get("page_number"),
                score=round(float(row.rank), 4),
            )
            for row in rows
        ]

    async def hybrid_search(
        self,
        db: AsyncSession,
        document_id: str,
        query: str,
        query_embedding: list[float],
        top_k: int = None,
    ) -> list[SourceChunk]:
        """
        Combines semantic search (pgvector) with keyword search (full-text).
        Deduplicates and re-ranks results using Reciprocal Rank Fusion (RRF).
        """
        top_k = top_k or settings.RETRIEVAL_TOP_K

        # Fetch both sets of results
        semantic_results = await self.similarity_search(db, document_id, query_embedding, top_k * 2)
        keyword_results = await self.keyword_search(db, document_id, query, top_k)

        # Merge using RRF: score = sum(1 / (rank + 60))
        scores: dict[str, float] = {}
        chunk_map: dict[str, SourceChunk] = {}

        for rank, chunk in enumerate(semantic_results):
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + 1 / (rank + 60)
            chunk_map[chunk.chunk_id] = chunk

        for rank, chunk in enumerate(keyword_results):
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + 1 / (rank + 60)
            chunk_map[chunk.chunk_id] = chunk

        # Sort by merged RRF score
        sorted_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)
        merged_results = [chunk_map[cid] for cid in sorted_ids[:top_k]]

        logger.info(f"Hybrid search returned {len(merged_results)} chunks")
        return merged_results

    async def get_full_document_context(
        self,
        db: AsyncSession,
        document_id: str,
        max_chunks: int = 50,
    ) -> str:
        """
        Retrieves all chunks for a document in order.
        Used for summary/notes/quiz/flashcard generation where full context is needed.
        """
        stmt = (
            select(DocumentChunk.content, DocumentChunk.metadata)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index)
            .limit(max_chunks)
        )
        result = await db.execute(stmt)
        rows = result.fetchall()

        # Assemble full context with page markers
        context_parts = []
        for row in rows:
            page_num = (row.metadata or {}).get("page_number", "?")
            context_parts.append(f"[Page {page_num}]\n{row.content}")

        return "\n\n".join(context_parts)

    async def delete_document_chunks(self, db: AsyncSession, document_id: str) -> int:
        """
        Deletes all vector embeddings for a given document.
        Called when a user deletes a document.
        """
        stmt = delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
        result = await db.execute(stmt)
        deleted_count = result.rowcount
        logger.info(f"Deleted {deleted_count} chunks for document {document_id}")
        return deleted_count


# Singleton instance
vector_store = VectorStoreService()
