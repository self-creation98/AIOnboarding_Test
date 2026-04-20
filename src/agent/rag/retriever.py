"""
Hybrid Retriever — vector search + keyword search + Reciprocal Rank Fusion.
"""

import logging
from ..core.config import TOP_K_RETRIEVAL, RRF_K
from ..core.embedder import embed_text
from src.backend.database import get_supabase

logger = logging.getLogger(__name__)


async def vector_search(
    query: str,
    top_k: int = 10,
    department: str | None = None,
    role: str | None = None,
) -> list[dict]:
    """
    Vector similarity search using pgvector.
    Tries RPC function first, falls back to direct query.
    """
    try:
        query_embedding = await embed_text(query)
        supabase = get_supabase()

        # Try RPC function (faster, server-side)
        try:
            params = {
                "query_embedding": query_embedding,
                "match_count": top_k,
            }
            if department:
                params["filter_department"] = department
            if role:
                params["filter_role"] = role

            result = supabase.rpc("match_chunks", params).execute()
            if result.data:
                return result.data
        except Exception as rpc_err:
            logger.debug(f"RPC not available, using fallback: {rpc_err}")

        # Fallback: fetch all chunks and compute similarity in Python
        query = supabase.table("knowledge_chunks").select(
            "id, content, chunk_index, document_id, embedding"
        ).limit(200)

        if department:
            query = query.contains("department_tags", [department])
        if role:
            query = query.contains("role_tags", [role])

        result = query.execute()
        chunks = result.data or []

        if not chunks:
            return []

        # Compute cosine similarity
        import numpy as np
        query_vec = np.array(query_embedding)
        query_norm = np.linalg.norm(query_vec)

        scored = []
        for chunk in chunks:
            emb = chunk.get("embedding")
            if not emb:
                continue
            chunk_vec = np.array(emb)
            chunk_norm = np.linalg.norm(chunk_vec)
            if query_norm == 0 or chunk_norm == 0:
                continue
            similarity = float(np.dot(query_vec, chunk_vec) / (query_norm * chunk_norm))
            scored.append({
                "id": chunk["id"],
                "content": chunk["content"],
                "chunk_index": chunk.get("chunk_index", 0),
                "document_id": chunk.get("document_id"),
                "similarity": similarity,
            })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

    except Exception as e:
        logger.error(f"Vector search error: {e}")
        return []


async def keyword_search(
    query: str,
    top_k: int = 10,
    department: str | None = None,
) -> list[dict]:
    """
    Full-text keyword search using PostgreSQL tsvector.
    """
    try:
        supabase = get_supabase()

        # Use textSearch on content_tsvector
        q = supabase.table("knowledge_chunks").select(
            "id, content, chunk_index, document_id"
        ).text_search("content", query, config="simple").limit(top_k)

        if department:
            q = q.contains("department_tags", [department])

        result = q.execute()
        return result.data or []

    except Exception as e:
        logger.debug(f"Keyword search error (non-critical): {e}")
        return []


def reciprocal_rank_fusion(
    vector_results: list[dict],
    keyword_results: list[dict],
    k: int = RRF_K,
) -> list[dict]:
    """
    Merge results from vector + keyword search using RRF.
    score(doc) = Σ 1/(k + rank_i)
    """
    scores = {}
    doc_map = {}

    # Score vector results
    for rank, doc in enumerate(vector_results):
        doc_id = doc["id"]
        scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        doc_map[doc_id] = doc

    # Score keyword results
    for rank, doc in enumerate(keyword_results):
        doc_id = doc["id"]
        scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + rank + 1)
        if doc_id not in doc_map:
            doc_map[doc_id] = doc

    # Sort by combined score
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for doc_id, score in ranked:
        doc = doc_map[doc_id]
        doc["rrf_score"] = score
        results.append(doc)

    return results


async def hybrid_search(
    query: str,
    department: str | None = None,
    role: str | None = None,
    top_k: int = TOP_K_RETRIEVAL,
) -> list[dict]:
    """
    Hybrid search: vector + keyword → RRF → top_k.
    Also fetches source_title from knowledge_documents.
    """
    # Run both searches
    vec_results = await vector_search(query, top_k=10, department=department, role=role)
    kw_results = await keyword_search(query, top_k=10, department=department)

    # Merge with RRF
    merged = reciprocal_rank_fusion(vec_results, kw_results)
    top_results = merged[:top_k]

    # Enrich with source_title from knowledge_documents
    if top_results:
        supabase = get_supabase()
        doc_ids = list({r.get("document_id") for r in top_results if r.get("document_id")})
        if doc_ids:
            docs_res = supabase.table("knowledge_documents").select(
                "id, title"
            ).in_("id", doc_ids).execute()
            title_map = {d["id"]: d["title"] for d in (docs_res.data or [])}
            for r in top_results:
                r["source_title"] = title_map.get(r.get("document_id"), "")

    return top_results
