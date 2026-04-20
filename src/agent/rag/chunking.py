"""
Text chunking — split documents into overlapping chunks at sentence boundaries.
"""

import re
from ..core.config import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_text(
    content: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Split text into chunks of ~chunk_size characters with overlap.
    Splits at sentence boundaries (. ! ? \\n) to avoid cutting mid-sentence.
    """
    if not content or not content.strip():
        return []

    # Split into sentences (handles Vietnamese punctuation)
    sentences = re.split(r'(?<=[.!?。\n])\s+', content.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        return [content.strip()] if content.strip() else []

    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # If adding this sentence would exceed chunk_size
        if current_chunk and len(current_chunk) + len(sentence) + 1 > chunk_size:
            chunks.append(current_chunk.strip())
            # Overlap: keep tail of current chunk
            if overlap > 0 and len(current_chunk) > overlap:
                current_chunk = current_chunk[-overlap:].strip() + " " + sentence
            else:
                current_chunk = sentence
        else:
            current_chunk = (current_chunk + " " + sentence).strip() if current_chunk else sentence

    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks


def chunk_document(content: str, title: str = "") -> list[dict]:
    """
    Chunk a document and return structured chunk objects.
    Each chunk has: content, chunk_index, source_title.
    """
    raw_chunks = chunk_text(content)
    return [
        {
            "content": chunk,
            "chunk_index": i,
            "source_title": title,
        }
        for i, chunk in enumerate(raw_chunks)
    ]
