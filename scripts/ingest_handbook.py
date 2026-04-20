"""
Bulk ingestion script — ingest all handbook .md files into the knowledge base.

Usage:
    python -m scripts.ingest_handbook
    
    # Or from project root:
    python scripts/ingest_handbook.py
"""

import asyncio
import os
import sys
import logging

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()

from src.backend.database import get_supabase
from src.agent.rag.chunking import chunk_text
from src.agent.core.embedder import embed_batch

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

HANDBOOK_DIR = os.path.join(os.path.dirname(__file__), "..", "handbook")

# Map filenames to category + tags
CATEGORY_MAP = {
    "policy-": ("policy", ["all"]),
    "guide-": ("guide", ["all"]),
    "process-": ("process", ["all"]),
    "facilities-": ("facilities", ["all"]),
    "org-": ("organization", ["all"]),
    "culture-": ("culture", ["all"]),
    "titles-for-": ("career", ["all"]),
    "getting-started": ("onboarding", ["nhan_vien_moi"]),
    "how-we-work": ("culture", ["all"]),
    "our-internal-systems": ("tools", ["all"]),
    "our-rituals": ("culture", ["all"]),
    "benefits-and-perks": ("benefits", ["all"]),
    "making-a-career": ("career", ["all"]),
    "managing-work-devices": ("tools", ["all"]),
    "moonlighting": ("policy", ["all"]),
    "severance": ("policy", ["all"]),
    "stateFMLA": ("policy", ["all"]),
}


def get_category_and_tags(filename: str) -> tuple[str, list[str]]:
    """Determine category and role_tags from filename."""
    for prefix, (cat, tags) in CATEGORY_MAP.items():
        if filename.startswith(prefix):
            return cat, tags
    return "general", ["all"]


async def ingest_one_file(filepath: str, supabase) -> dict:
    """Ingest a single .md file."""
    filename = os.path.basename(filepath)
    title = filename.replace(".md", "").replace("-", " ").title()

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if not content.strip():
        logger.warning(f"  ⏭ Skipped (empty): {filename}")
        return {"file": filename, "chunks": 0, "status": "skipped"}

    category, role_tags = get_category_and_tags(filename)

    # Check if document already exists
    existing = (
        supabase.table("knowledge_documents")
        .select("id")
        .eq("title", title)
        .limit(1)
        .execute()
    )

    if existing.data:
        doc_id = existing.data[0]["id"]
        # Delete old chunks
        supabase.table("knowledge_chunks").delete().eq("document_id", doc_id).execute()
        # Update document content
        supabase.table("knowledge_documents").update({
            "content": content,
            "word_count": len(content.split()),
            "category": category,
            "role_tags": role_tags,
            "is_indexed": False,
        }).eq("id", doc_id).execute()
        logger.info(f"  🔄 Updated existing: {filename}")
    else:
        # Insert new document
        result = supabase.table("knowledge_documents").insert({
            "title": title,
            "content": content,
            "source_type": "handbook",
            "language": "vi",
            "word_count": len(content.split()),
            "category": category,
            "role_tags": role_tags,
            "is_indexed": False,
        }).execute()
        doc_id = result.data[0]["id"]
        logger.info(f"  ✨ Created new: {filename}")

    # Chunk the content
    chunks = chunk_text(content)
    if not chunks:
        return {"file": filename, "chunks": 0, "status": "no_chunks"}

    # Embed all chunks
    logger.info(f"  📐 Embedding {len(chunks)} chunks...")
    embeddings = await embed_batch(chunks)

    # Insert chunks
    rows = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        rows.append({
            "document_id": doc_id,
            "content": chunk,
            "chunk_index": i,
            "token_count": len(chunk.split()),
            "embedding": embedding,
            "role_tags": role_tags,
        })

    # Batch insert (split into groups of 20 to avoid payload limits)
    for batch_start in range(0, len(rows), 20):
        batch = rows[batch_start:batch_start + 20]
        supabase.table("knowledge_chunks").insert(batch).execute()

    # Mark as indexed
    supabase.table("knowledge_documents").update(
        {"is_indexed": True}
    ).eq("id", doc_id).execute()

    return {"file": filename, "chunks": len(chunks), "status": "ok"}


async def main():
    """Ingest all handbook files."""
    if not os.path.isdir(HANDBOOK_DIR):
        logger.error(f"Handbook directory not found: {HANDBOOK_DIR}")
        return

    md_files = sorted([
        os.path.join(HANDBOOK_DIR, f)
        for f in os.listdir(HANDBOOK_DIR)
        if f.endswith(".md") and f != "README.md"
    ])

    logger.info(f"📚 Found {len(md_files)} handbook files to ingest")

    supabase = get_supabase()
    results = []
    total_chunks = 0

    for filepath in md_files:
        filename = os.path.basename(filepath)
        logger.info(f"📖 Processing: {filename}")
        try:
            result = await ingest_one_file(filepath, supabase)
            results.append(result)
            total_chunks += result.get("chunks", 0)
        except Exception as e:
            logger.error(f"  ❌ Error: {e}")
            results.append({"file": filename, "chunks": 0, "status": f"error: {e}"})

    # Summary
    ok_count = sum(1 for r in results if r["status"] == "ok")
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Done! {ok_count}/{len(md_files)} files ingested")
    logger.info(f"📊 Total chunks created: {total_chunks}")
    logger.info(f"{'='*60}")

    # Print table
    for r in results:
        status_icon = "✅" if r["status"] == "ok" else "⏭" if r["status"] == "skipped" else "❌"
        logger.info(f"  {status_icon} {r['file']}: {r['chunks']} chunks ({r['status']})")


if __name__ == "__main__":
    asyncio.run(main())
