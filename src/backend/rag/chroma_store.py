"""
ChromaDB Vector Store — Persistent embedding store for RAG documents.

Handles:
- Loading documents from docs/documents.json
- Generating OpenAI embeddings for each document
- Persisting vectors in ChromaDB (local on-disk)
- Semantic search via cosine similarity
"""

import json
import logging
import os
import asyncio
from pathlib import Path
from typing import List, Dict, Any, Optional

import chromadb
from chromadb.config import Settings
from src.backend.rag.embeddings import get_local_embeddings
from src.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

# ─── Paths ───────────────────────────────────────────────────────────────────

_RAG_DIR = Path(__file__).parent
DOCUMENTS_PATH = _RAG_DIR / "docs" / "documents.json"

# ChromaDB persistent storage lives next to this file
CHROMA_PERSIST_DIR = str(_RAG_DIR / "chroma_db")

# Collection name
COLLECTION_NAME = "hr_documents"


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _load_json_documents() -> List[Dict[str, Any]]:
    """Load raw documents from JSON file."""
    if not DOCUMENTS_PATH.exists():
        logger.warning(f"Documents file not found: {DOCUMENTS_PATH}")
        return []
    try:
        with open(DOCUMENTS_PATH, "r", encoding="utf-8") as f:
            docs = json.load(f)
        logger.info(f"Loaded {len(docs)} documents from {DOCUMENTS_PATH}")
        return docs
    except Exception as e:
        logger.error(f"Failed to load documents: {e}")
        return []


# ─── ChromaVectorStore ────────────────────────────────────────────────────────

class ChromaVectorStore:
    """
    Wraps ChromaDB + OpenAI Embeddings for persistent document retrieval.

    Usage:
        store = ChromaVectorStore()
        store.ingest()          # One-time: embed & store all documents
        results = store.search("nghỉ phép năm", top_k=3)
    """

    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        persist_dir: str = CHROMA_PERSIST_DIR,
        collection_name: str = COLLECTION_NAME,
    ):
        self._api_key = openai_api_key or OPENAI_API_KEY
        self._persist_dir = persist_dir
        self._collection_name = collection_name

        # Embedding model (Local Vietnamese Embedding — fast & no API cost)
        try:
            self._embedding_fn = get_local_embeddings()
        except Exception as e:
            logger.error(f"Failed to load local embeddings: {e}")
            self._embedding_fn = None

        # ChromaDB persistent client
        os.makedirs(self._persist_dir, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=self._persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )

        # Get or create collection (ChromaDB manages its own storage)
        self._collection = self._client.get_or_create_collection(
            name=self._collection_name,
            metadata={"hnsw:space": "cosine"},  # Use cosine similarity
        )
        logger.info(
            f"ChromaDB ready — collection='{self._collection_name}', "
            f"path='{self._persist_dir}', "
            f"docs_stored={self._collection.count()}"
        )

    # ── Ingestion ─────────────────────────────────────────────────────────────

    def ingest(self, force: bool = False, custom_documents: Optional[List[Dict[str, Any]]] = None) -> int:
        """
        Embed and store all documents into ChromaDB.

        Args:
            force: If True, wipe existing vectors and re-ingest everything.
            custom_documents: Optional list of documents to ingest instead of loading from default JSON.

        Returns:
            Number of documents ingested.
        """
        if self._embedding_fn is None:
            logger.error("Cannot ingest — embedding model unavailable.")
            return 0

        documents = custom_documents if custom_documents is not None else _load_json_documents()
        if not documents:
            logger.warning("No documents to ingest.")
            return 0

        existing_count = self._collection.count()

        if existing_count > 0 and not force and custom_documents is None:
            logger.info(
                f"Collection already has {existing_count} documents. "
                "Skipping ingest (use force=True to re-embed)."
            )
            return existing_count

        if force and existing_count > 0:
            logger.info(f"Force re-ingest: deleting {existing_count} existing vectors.")
            self._client.delete_collection(self._collection_name)
            self._collection = self._client.get_or_create_collection(
                name=self._collection_name,
                metadata={"hnsw:space": "cosine"},
            )

        # Build texts, ids, and metadata
        ids: List[str] = []
        texts: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for doc in documents:
            doc_id = doc.get("id", f"doc_{len(ids)}")
            title = doc.get("title", "")
            content = doc.get("content", "")
            category = doc.get("category", "general")

            # Combine title + content for richer embedding context
            full_text = f"Tiêu đề: {title}\n\nNội dung: {content}"

            ids.append(doc_id)
            texts.append(full_text)
            metadatas.append({
                "id": doc_id,
                "title": title,
                "category": category,
                "content": content,   # Store raw content for retrieval
            })

        logger.info(f"Generating embeddings for {len(texts)} documents via OpenAI...")

        try:
            embeddings = self._embedding_fn.embed_documents(texts)
        except Exception as e:
            logger.error(f"OpenAI embedding failed: {e}")
            return 0

        # Upsert into ChromaDB
        self._collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,          # Store the combined text for reference
            metadatas=metadatas,
        )

        count = self._collection.count()
        logger.info(f"✅ Ingested {count} documents into ChromaDB.")
        return count

    # ── Search ────────────────────────────────────────────────────────────────

    async def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Semantic search: embed query → find nearest documents.

        Returns list of dicts with keys: id, title, category, content, score.
        """
        if self._embedding_fn is None:
            logger.error("Cannot search — embedding model unavailable.")
            return []

        if self._collection.count() == 0:
            logger.warning("Collection is empty. Call ingest() first.")
            return []

        try:
            # Use async embedding
            query_embedding = await self._embedding_fn.aembed_query(query)
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            return []

        try:
            results = await asyncio.to_thread(
                self._collection.query,
                query_embeddings=[query_embedding],
                n_results=min(top_k, self._collection.count()),
                include=["metadatas", "distances"],
            )
        except Exception as e:
            logger.error(f"ChromaDB query failed: {e}")
            return []

        hits: List[Dict[str, Any]] = []
        metadatas_list = results.get("metadatas", [[]])[0]
        distances_list = results.get("distances", [[]])[0]

        for meta, dist in zip(metadatas_list, distances_list):
            # ChromaDB cosine distance → similarity = 1 - distance
            similarity = round(1.0 - dist, 4)
            hits.append({
                "id": meta.get("id", ""),
                "title": meta.get("title", ""),
                "category": meta.get("category", ""),
                "content": meta.get("content", ""),
                "score": similarity,
            })

        logger.info(
            f"Search '{query[:60]}' → {len(hits)} results "
            f"(top score: {hits[0]['score'] if hits else 'N/A'})"
        )
        return hits

    # ── Status ────────────────────────────────────────────────────────────────

    def count(self) -> int:
        """Return number of documents stored."""
        return self._collection.count()

    def is_ready(self) -> bool:
        """True if the collection has at least one document."""
        return self._collection.count() > 0


# ─── Module-level Singleton ──────────────────────────────────────────────────

_store: Optional[ChromaVectorStore] = None
_store_lock: Optional[asyncio.Lock] = None

async def get_chroma_store() -> ChromaVectorStore:
    """
    Return the singleton ChromaVectorStore, creating and ingesting if needed.
    Thread-safe for single-process use (FastAPI default).
    """
    global _store, _store_lock
    if _store_lock is None:
        _store_lock = asyncio.Lock()

    if _store is None:
        async with _store_lock:
            # Double check inside the lock
            if _store is None:
                temp_store = ChromaVectorStore()
                if not temp_store.is_ready():
                    logger.info("ChromaDB is empty — running first-time ingestion...")
                    await asyncio.to_thread(temp_store.ingest)
                _store = temp_store
    return _store


# ─── Convenience search function (used by graph.py retriever node) ────────────

async def search_documents_chroma(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Drop-in replacement for the old keyword/cosine search_documents().

    Returns list of dicts with: id, content  (same shape as before).
    """
    store = await get_chroma_store()
    results = await store.search(query, top_k=top_k)
    # Return only id + content to keep compatibility with graph.py
    return [{"id": r["id"], "content": r["content"], "title": r["title"], "score": r["score"]} for r in results]
