import logging
import asyncio
import threading
from typing import Optional
from langchain_community.embeddings import HuggingFaceEmbeddings

logger = logging.getLogger(__name__)

_embedder: Optional[HuggingFaceEmbeddings] = None
_embedder_lock = asyncio.Lock()
_thread_lock = threading.Lock()

def get_local_embeddings() -> HuggingFaceEmbeddings:
    """
    Singleton provider for local embeddings to avoid loading the model multiple times.
    Loading a model takes a few seconds and ~500MB+ RAM.
    """
    global _embedder
    if _embedder is None:
        with _thread_lock:
            if _embedder is None:
                logger.info("Loading HuggingFaceEmbeddings (thanhtantran/Vietnamese_Embedding_v2)...")
                _embedder = HuggingFaceEmbeddings(
                    model_name="thanhtantran/Vietnamese_Embedding_v2",
                    model_kwargs={'device': 'cpu'},
                    encode_kwargs={'normalize_embeddings': True}
                )
                logger.info("✅ Local embeddings loaded.")
    return _embedder

async def aget_local_embeddings() -> HuggingFaceEmbeddings:
    global _embedder
    if _embedder is None:
        async with _embedder_lock:
            if _embedder is None:
                _embedder = await asyncio.to_thread(get_local_embeddings)
    return _embedder
