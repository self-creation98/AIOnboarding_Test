"""
Agent Interface — 5 exported functions that the backend calls.

Functions:
- chat()              — LangGraph agent flow (POST /api/chat)
- search()            — Hybrid RAG search
- ingest_document()   — Chunk → embed → store (POST /api/documents/upload)
- copilot_analyze()   — AI summary for HR (POST /api/analytics/copilot)
- detect_content_gaps() — Cluster unanswered questions (GET /api/analytics/content-gaps)
"""

import logging
from datetime import date

from .graph.builder import get_agent
from .rag.retriever import hybrid_search
from .rag.chunking import chunk_text
from .core.embedder import embed_batch
from .core.llm import generate_json
from .prompts.system import COPILOT_PROMPT, CONTENT_GAP_PROMPT
from src.backend.database import get_supabase

logger = logging.getLogger(__name__)


# ─── 1. Chat — Main agent flow ───

async def chat(message: str, employee_id: str, conversation_id: str) -> dict:
    """
    Run the LangGraph agent for a chat message.
    Returns: {response, sources, confidence, intent, actions_taken}
    """
    agent = get_agent()

    initial_state = {
        "message": message,
        "employee_id": employee_id,
        "conversation_id": conversation_id,
    }

    try:
        result = await agent.ainvoke(initial_state)
        return {
            "response": result.get("response", "Xin lỗi, tôi không thể xử lý yêu cầu."),
            "sources": result.get("sources", []),
            "confidence": result.get("confidence", 0.0),
            "intent": result.get("intent", "unknown"),
            "actions_taken": result.get("actions_taken", []),
        }
    except Exception as e:
        logger.error(f"Agent chat error: {e}")
        return {
            "response": "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.",
            "sources": [],
            "confidence": 0.0,
            "intent": "error",
            "actions_taken": [],
        }


# ─── 2. Search — Hybrid RAG search ───

async def search(query: str, department: str = None, role: str = None) -> list[dict]:
    """
    Hybrid search: vector + keyword → RRF.
    Returns: [{chunk_id, content, score, source_title, source_id}]
    """
    try:
        results = await hybrid_search(query, department=department, role=role)
        return [
            {
                "chunk_id": r.get("id", ""),
                "content": r.get("content", ""),
                "score": r.get("rrf_score", r.get("similarity", 0)),
                "source_title": r.get("source_title", ""),
                "source_id": r.get("document_id", ""),
            }
            for r in results
        ]
    except Exception as e:
        logger.error(f"Search error: {e}")
        return []


# ─── 3. Ingest — Chunk → Embed → Store ───

async def ingest_document(
    doc_id: str,
    content: str,
    title: str = "",
    department_tags: list[str] | None = None,
    role_tags: list[str] | None = None,
) -> dict:
    """
    Ingest a document: chunk → embed → insert into knowledge_chunks.
    Returns: {chunks_created, doc_id}
    """
    try:
        # Chunk the content
        chunks = chunk_text(content)
        if not chunks:
            return {"chunks_created": 0, "doc_id": doc_id}

        # Embed all chunks in batch
        embeddings = await embed_batch(chunks)

        # Insert into knowledge_chunks
        supabase = get_supabase()
        rows = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            row = {
                "document_id": doc_id,
                "content": chunk,
                "chunk_index": i,
                "token_count": len(chunk.split()),
                "embedding": embedding,
            }
            if department_tags:
                row["department_tags"] = department_tags
            if role_tags:
                row["role_tags"] = role_tags
            rows.append(row)

        # Batch insert (Supabase handles array)
        supabase.table("knowledge_chunks").insert(rows).execute()

        logger.info(f"Ingested doc {doc_id}: {len(rows)} chunks")
        return {"chunks_created": len(rows), "doc_id": doc_id}

    except Exception as e:
        logger.error(f"Ingest error for doc {doc_id}: {e}")
        return {"chunks_created": 0, "doc_id": doc_id, "error": str(e)}


# ─── 4. Copilot — AI analysis for HR ───

async def copilot_analyze(employee_id: str) -> dict:
    """
    AI-powered HR copilot: summarize employee status + suggest actions.
    Returns: {summary, risk_factors, suggestions, priority}
    """
    try:
        supabase = get_supabase()
        today = date.today()

        # Employee info
        emp_res = (supabase.table("employees")
            .select("full_name, role, department, start_date, health_score, onboarding_status")
            .eq("id", employee_id).limit(1).execute())
        if not emp_res.data:
            return {"summary": "Không tìm thấy nhân viên.", "risk_factors": [], "suggestions": []}
        employee = emp_res.data[0]

        # Checklist stats
        cl_res = (supabase.table("checklist_items")
            .select("status, deadline_date")
            .eq("employee_id", employee_id).execute())
        items = cl_res.data or []
        total = len(items)
        completed = sum(1 for i in items if i["status"] == "hoan_thanh")
        overdue = sum(1 for i in items
            if i["status"] in ("chua_bat_dau", "dang_lam")
            and i.get("deadline_date") and str(i["deadline_date"]) < today.isoformat())
        pct = round(completed / total * 100, 1) if total > 0 else 0

        # Stakeholder tasks
        st_res = (supabase.table("stakeholder_tasks")
            .select("assigned_to_team, status, title")
            .eq("employee_id", employee_id).execute())
        st_data = st_res.data or []
        st_pending = [t for t in st_data if t["status"] == "pending"]

        # Latest sentiment
        sent_res = (supabase.table("sentiment_logs")
            .select("sentiment")
            .eq("employee_id", employee_id)
            .order("created_at", desc=True).limit(1).execute())
        latest_sentiment = sent_res.data[0]["sentiment"] if sent_res.data else "N/A"

        # Preboarding
        pb_res = (supabase.table("preboarding_documents")
            .select("document_type, status")
            .eq("employee_id", employee_id).execute())
        pb_data = pb_res.data or []
        missing = [d["document_type"] for d in pb_data if d["status"] == "missing"]

        # Build prompt
        prompt = COPILOT_PROMPT.format(
            employee_data=f"Tên: {employee['full_name']}, Vị trí: {employee['role']}, "
                         f"Phòng: {employee['department']}, Start: {employee.get('start_date', 'N/A')}, "
                         f"Health: {employee.get('health_score', 'N/A')}",
            total_items=total,
            completed_items=completed,
            overdue_items=overdue,
            completion_pct=pct,
            stakeholder_info=f"{len(st_pending)} tasks pending: " +
                            ", ".join([f"{t['title']} ({t['assigned_to_team']})" for t in st_pending[:5]]),
            latest_sentiment=latest_sentiment,
            preboarding_info=f"Thiếu {len(missing)} giấy tờ: {', '.join(missing)}" if missing else "Đã nộp đủ",
        )

        result = await generate_json(
            prompt="Phân tích và đưa ra đề xuất.",
            system_instruction=prompt,
        )

        return {
            "summary": result.get("summary", ""),
            "risk_factors": result.get("risk_factors", []),
            "suggestions": result.get("suggestions", []),
            "priority": result.get("priority", "low"),
        }

    except Exception as e:
        logger.error(f"Copilot analyze error: {e}")
        return {"summary": f"Lỗi phân tích: {e}", "risk_factors": [], "suggestions": []}


# ─── 5. Content Gap Detection ───

async def detect_content_gaps() -> list[dict]:
    """
    Cluster unanswered questions into topic groups using LLM.
    Returns: [{topic, count, priority, sample_questions, suggested_doc}]
    """
    try:
        supabase = get_supabase()

        # Get unreviewed unanswered questions
        result = (supabase.table("unanswered_questions")
            .select("question_text, reason, confidence_score")
            .eq("reviewed", False)
            .order("created_at", desc=True)
            .limit(100)
            .execute())

        questions = result.data or []
        if len(questions) < 3:
            return []

        # Build question list for LLM
        q_list = "\n".join([
            f"{i+1}. {q['question_text']} (lý do: {q.get('reason', 'N/A')})"
            for i, q in enumerate(questions)
        ])

        prompt = CONTENT_GAP_PROMPT.format(questions=q_list)
        result = await generate_json(
            prompt="Phân tích và nhóm các câu hỏi.",
            system_instruction=prompt,
        )

        clusters = result.get("clusters", [])
        return clusters

    except Exception as e:
        logger.error(f"Content gap detection error: {e}")
        return []
