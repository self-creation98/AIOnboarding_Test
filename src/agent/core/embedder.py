"""
OpenAI Embedding wrapper — text-embedding-3-small (768 dims).
"""

import logging
from openai import AsyncOpenAI
from src.config import OPENAI_API_KEY
from .config import EMBEDDING_MODEL, EMBEDDING_DIMENSIONS

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not set in .env")
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client


async def embed_text(text: str) -> list[float]:
    """Embed a single text string → 768-dim vector."""
    client = _get_client()
    try:
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=text,
            dimensions=EMBEDDING_DIMENSIONS,
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Embedding error: {e}")
        raise


async def embed_batch(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts → list of 768-dim vectors."""
    if not texts:
        return []
    client = _get_client()
    try:
        response = await client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
            dimensions=EMBEDDING_DIMENSIONS,
        )
        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        return [d.embedding for d in sorted_data]
    except Exception as e:
        logger.error(f"Batch embedding error: {e}")
        raise
