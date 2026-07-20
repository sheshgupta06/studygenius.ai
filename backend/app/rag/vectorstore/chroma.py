"""
ChromaDB Vector Store Service — StudyGenius AI
Replaces pgvector. Each document gets its own isolated ChromaDB collection.
"""

import logging
from typing import Optional
import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config.settings import get_settings
from app.models.schemas import SourceChunk

logger = logging.getLogger(__name__)
settings = get_settings()


def _collection_name(document_id: str) -> str:
    """
    Generates a deterministic, ChromaDB-safe collection name for a document.
    ChromaDB requires collection names to be 3-63 chars, alphanumeric + underscores/hyphens.
    """
    # Prefix with 'doc_' and strip hyphens from UUID
    return f"doc_{document_id.replace('-', '_')}"


class ChromaStoreService:
    """
    Manages all ChromaDB operations:
    - Creating / deleting per-document collections
    - Storing chunks with embeddings
    - Semantic similarity search
    - Full document retrieval for generation
    """

    def __init__(self):
        self._client: Optional[chromadb.ClientAPI] = None

    def _get_client(self) -> chromadb.ClientAPI:
        """
        Returns a ChromaDB persistent client (local file-based, no Docker needed).
        """
        if self._client is None:
            import os
            chroma_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "chroma_data")
            os.makedirs(chroma_dir, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=chroma_dir,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
        return self._client

    def store_chunks(
        self,
        document_id: str,
        chunks: list[dict],
        embeddings: list[list[float]],
    ) -> int:
        """
        Stores document chunks with precomputed embeddings in ChromaDB.
        Creates the collection if it doesn't exist.
        Returns the number of chunks stored.
        """
        client = self._get_client()
        collection_name = _collection_name(document_id)

        # Get or create collection for this document
        collection = client.get_or_create_collection(
            name=collection_name,
            metadata={"document_id": document_id, "hnsw:space": "cosine"},
        )

        # Prepare data for ChromaDB
        ids = [f"chunk_{chunk['chunk_index']}" for chunk in chunks]
        documents = [chunk["content"] for chunk in chunks]
        metadatas = [chunk.get("metadata", {}) for chunk in chunks]

        # Upsert chunks with precomputed embeddings
        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

        logger.info(f"Stored {len(chunks)} chunks in ChromaDB collection '{collection_name}'")
        return len(chunks)

    def similarity_search(
        self,
        document_id: str,
        query_embedding: list[float],
        top_k: int = None,
    ) -> list[SourceChunk]:
        """
        Queries ChromaDB for the most semantically similar chunks.
        Returns a list of SourceChunk objects with page citations.
        """
        top_k = top_k or settings.RETRIEVAL_TOP_K
        client = self._get_client()
        collection_name = _collection_name(document_id)

        try:
            collection = client.get_collection(collection_name)
        except Exception:
            logger.warning(f"Collection '{collection_name}' not found for document {document_id}")
            return []

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        source_chunks = []
        if results and results["ids"] and results["ids"][0]:
            for i, chunk_id in enumerate(results["ids"][0]):
                distance = results["distances"][0][i]
                # ChromaDB cosine distance: 0 = identical, 2 = opposite
                # Convert to similarity score: 1 - (distance / 2)
                similarity = round(1.0 - (distance / 2.0), 4)

                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                content = results["documents"][0][i] if results["documents"] else ""

                source_chunks.append(
                    SourceChunk(
                        chunk_id=chunk_id,
                        content=content,
                        page_number=metadata.get("page_number"),
                        score=similarity,
                    )
                )

        logger.info(f"ChromaDB returned {len(source_chunks)} chunks for document {document_id}")
        return source_chunks

    def get_full_document_context(
        self,
        document_id: str,
        max_chunks: int = 50,
    ) -> str:
        """
        Retrieves all stored chunks for a document in order.
        Used for generation tasks (summary, notes, quiz, flashcards) where full context is needed.
        """
        client = self._get_client()
        collection_name = _collection_name(document_id)

        try:
            collection = client.get_collection(collection_name)
            total = collection.count()
            limit = min(total, max_chunks)

            if limit == 0:
                return ""

            results = collection.get(
                limit=limit,
                include=["documents", "metadatas"],
            )

            # Sort by chunk index to maintain document order
            combined = sorted(
                zip(results["ids"], results["documents"], results["metadatas"]),
                key=lambda x: int(x[0].replace("chunk_", "")),
            )

            context_parts = []
            for _, content, metadata in combined:
                page_num = (metadata or {}).get("page_number", "?")
                context_parts.append(f"[Page {page_num}]\n{content}")

            return "\n\n".join(context_parts)

        except Exception as e:
            logger.error(f"Failed to retrieve full context for {document_id}: {e}")
            return ""

    def delete_collection(self, document_id: str) -> bool:
        """
        Deletes the ChromaDB collection for a document.
        Called when a user deletes a document.
        Returns True if deleted, False if collection didn't exist.
        """
        client = self._get_client()
        collection_name = _collection_name(document_id)

        try:
            client.delete_collection(collection_name)
            logger.info(f"Deleted ChromaDB collection '{collection_name}'")
            return True
        except Exception as e:
            logger.warning(f"Could not delete collection '{collection_name}': {e}")
            return False

    def collection_exists(self, document_id: str) -> bool:
        """Checks whether a ChromaDB collection exists for a document."""
        client = self._get_client()
        collection_name = _collection_name(document_id)
        try:
            client.get_collection(collection_name)
            return True
        except Exception:
            return False


# Singleton instance
chroma_store = ChromaStoreService()
