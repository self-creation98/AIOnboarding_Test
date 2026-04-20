"""
LangGraph nodes — each node is an async function that transforms AgentState.
"""

import logging
from datetime import date

from ..core.llm import generate_json
from ..core.config import CONFIDENCE_THRESHOLD
from ..rag.retriever import hybrid_search
from ..prompts.system import (
    INTENT_CLASSIFIER_PROMPT,
    RAG_ANSWER_PROMPT,
    SENTIMENT_PROMPT,
    GREETING_RESPONSES,
)
from src.backend.database import get_supabase

logger = logging.getLogger(__name__)


# ─── Node 1: Load employee context from DB ───

async def load_context(state: dict) -> dict:
    """Load employee info + checklist summary from Supabase."""
    try:
        supabase = get_supabase()
        eid = state.get("employee_id", "")

        # Employee info
        emp_res = (
            supabase.table("employees")
            .select("full_name, role, department, onboarding_status")
            .eq("id", eid)
            .limit(1)
            .execute()
        )
        employee = emp_res.data[0] if emp_res.data else {}

        # Pending checklist items
        pending_items = []
        cl_res = (
            supabase.table("checklist_items")
            .select("title, status, deadline_date, category")
            .eq("employee_id", eid)
            .in_("status", ["chua_bat_dau", "dang_lam"])
            .order("deadline_date")
            .limit(10)
            .execute()
        )
        pending_items = cl_res.data or []

        # Recent chat history (last 6 messages for context)
        history = []
        if state.get("conversation_id"):
            hist_res = (
                supabase.table("chatbot_messages")
                .select("role, content")
                .eq("conversation_id", state["conversation_id"])
                .order("created_at", desc=True)
                .limit(6)
                .execute()
            )
            history = list(reversed(hist_res.data or []))

        state["employee_context"] = {
            "full_name": employee.get("full_name", "Nhân viên"),
            "role": employee.get("role", ""),
            "department": employee.get("department", ""),
            "status": employee.get("onboarding_status", ""),
            "pending_tasks": [
                f"- {t['title']} (hạn: {t.get('deadline_date', 'N/A')})"
                for t in pending_items
            ],
            "chat_history": history,
        }
    except Exception as e:
        logger.warning(f"load_context error: {e}")
        state["employee_context"] = {
            "full_name": "Nhân viên",
            "role": "", "department": "",
            "pending_tasks": [], "chat_history": [],
        }

    return state


# ─── Node 2: Classify intent ───

async def classify_intent(state: dict) -> dict:
    """Classify user message intent using LLM."""
    message = state.get("message", "")

    # Quick pattern matching for simple intents (save LLM call)
    msg_lower = message.lower().strip()
    greetings = ["chào", "hello", "hi", "xin chào", "hey", "cảm ơn", "thanks", "thank"]
    if any(msg_lower.startswith(g) or msg_lower == g for g in greetings):
        state["intent"] = "greeting"
        return state

    try:
        result = await generate_json(
            prompt=f'Tin nhắn nhân viên: "{message}"',
            system_instruction=INTENT_CLASSIFIER_PROMPT,
        )
        state["intent"] = result.get("intent", "policy_question")
    except Exception as e:
        logger.warning(f"Intent classification error, defaulting: {e}")
        state["intent"] = "policy_question"

    return state


# ─── Node 3: RAG retrieve + generate answer ───

async def retrieve_and_generate(state: dict) -> dict:
    """Search knowledge base + generate answer with citations."""
    message = state.get("message", "")
    ctx = state.get("employee_context", {})

    # Hybrid search
    chunks = await hybrid_search(
        query=message,
        department=ctx.get("department"),
        role=ctx.get("role"),
    )
    state["retrieved_chunks"] = chunks

    if not chunks:
        state["response"] = (
            "Tôi chưa tìm thấy thông tin liên quan trong tài liệu nội bộ. "
            "Bạn có thể mô tả rõ hơn câu hỏi, hoặc tôi sẽ chuyển cho HR hỗ trợ."
        )
        state["sources"] = []
        state["confidence"] = 0.2
        state["actions_taken"] = []

        # Log as unanswered question
        try:
            supabase = get_supabase()
            supabase.table("unanswered_questions").insert({
                "employee_id": state.get("employee_id"),
                "conversation_id": state.get("conversation_id"),
                "question_text": message,
                "reason": "no_match",
                "confidence_score": 0.2,
            }).execute()
        except Exception:
            pass

        return state

    # Build context string
    context_str = "\n\n".join([
        f"[Chunk {i}] (Nguồn: {c.get('source_title', 'N/A')})\n{c['content']}"
        for i, c in enumerate(chunks)
    ])

    pending_str = "\n".join(ctx.get("pending_tasks", [])) or "Không có"

    prompt = RAG_ANSWER_PROMPT.format(
        context=context_str,
        employee_name=ctx.get("full_name", "Nhân viên"),
        employee_role=ctx.get("role", "N/A"),
        employee_department=ctx.get("department", "N/A"),
        pending_tasks=pending_str,
    )

    try:
        result = await generate_json(
            prompt=f'Câu hỏi: "{message}"',
            system_instruction=prompt,
        )
        state["response"] = result.get("response", "Xin lỗi, tôi không thể trả lời câu hỏi này.")
        state["confidence"] = float(result.get("confidence", 0.5))

        # Build sources from used chunk indices
        sources_used = result.get("sources_used", [])
        sources = []
        for idx in sources_used:
            if isinstance(idx, int) and idx < len(chunks):
                chunk = chunks[idx]
                sources.append({
                    "title": chunk.get("source_title", ""),
                    "chunk_id": chunk.get("id", ""),
                })
        state["sources"] = sources

    except Exception as e:
        logger.error(f"RAG generate error: {e}")
        state["response"] = "Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau."
        state["confidence"] = 0.0
        state["sources"] = []

    state["actions_taken"] = []

    # Log unanswered if low confidence
    if state["confidence"] < CONFIDENCE_THRESHOLD:
        try:
            supabase = get_supabase()
            supabase.table("unanswered_questions").insert({
                "employee_id": state.get("employee_id"),
                "conversation_id": state.get("conversation_id"),
                "question_text": message,
                "reason": "low_confidence",
                "confidence_score": state["confidence"],
            }).execute()
        except Exception:
            pass

    return state


# ─── Node 4: Analyze sentiment ───

async def analyze_sentiment(state: dict) -> dict:
    """Analyze message sentiment and log to DB."""
    message = state.get("message", "")

    try:
        prompt = SENTIMENT_PROMPT.format(message=message)
        result = await generate_json(
            prompt=prompt,
            system_instruction="Bạn là hệ thống phân tích cảm xúc.",
        )
        state["sentiment"] = result.get("sentiment", "neutral")
        state["sentiment_confidence"] = float(result.get("confidence", 0.5))
        state["sentiment_topics"] = result.get("topics", [])

        # Log to sentiment_logs
        supabase = get_supabase()
        supabase.table("sentiment_logs").insert({
            "employee_id": state.get("employee_id"),
            "conversation_id": state.get("conversation_id"),
            "sentiment": state["sentiment"],
            "confidence": state["sentiment_confidence"],
            "topics": state["sentiment_topics"],
        }).execute()

    except Exception as e:
        logger.warning(f"Sentiment analysis error: {e}")
        state["sentiment"] = "neutral"
        state["sentiment_confidence"] = 0.5
        state["sentiment_topics"] = []

    return state


# ─── Node 5: Handle greeting / escalation (no RAG needed) ───

async def handle_simple(state: dict) -> dict:
    """Handle greetings and escalation without RAG."""
    intent = state.get("intent", "greeting")
    state["response"] = GREETING_RESPONSES.get(intent, GREETING_RESPONSES["greeting"])
    state["sources"] = []
    state["confidence"] = 1.0
    state["actions_taken"] = []

    if intent == "escalation":
        state["actions_taken"] = ["escalated_to_hr"]
        # Mark conversation as escalated
        try:
            supabase = get_supabase()
            if state.get("conversation_id"):
                supabase.table("chatbot_conversations").update({
                    "escalated": True,
                }).eq("id", state["conversation_id"]).execute()
        except Exception:
            pass

    return state
