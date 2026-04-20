"""
Chat API — Endpoints cho chatbot AI onboarding.

Endpoints:
- POST  /api/chat                       — Gửi tin nhắn cho chatbot
- GET   /api/chat/history/{employee_id} — Lịch sử chat của nhân viên
- POST  /api/chat/feedback              — Gửi feedback cho câu trả lời
"""

import logging

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.backend.database import get_supabase
from src.backend.api.deps import get_current_active_user
from src.backend.schemas import UserInfo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


# ─── Schemas ───


class ChatRequest(BaseModel):
    """Body cho POST /api/chat."""
    employee_id: str = Field(..., description="UUID of employee", examples=["550e8400-e29b-41d4-a716-446655440000"])
    message: str = Field(..., min_length=1, examples=["Chính sách nghỉ phép như thế nào?"])


class FeedbackRequest(BaseModel):
    """Body cho POST /api/chat/feedback."""
    message_id: str = Field(..., description="UUID of assistant message", examples=["550e8400-e29b-41d4-a716-446655440000"])
    feedback: str = Field(..., description="positive | negative", examples=["positive"])


# ─── Helpers ───


def _ok(data):
    """Standard success response."""
    return {"success": True, "data": data}


def _err(msg: str, status_code: int = 400):
    """Standard error response — returned as dict, caller sets status."""
    return {"success": False, "error": msg}


# ─── Endpoints ───


@router.post(
    "",
    summary="Gui tin nhan cho chatbot",
    description="Gui message va nhan phan hoi tu AI chatbot. "
                "Tu dong tao conversation moi neu chua co.",
    status_code=201,
)
async def send_message(
    body: ChatRequest,
    current_user: UserInfo = Depends(get_current_active_user),
):
    """POST /api/chat — gui tin nhan, nhan phan hoi."""
    if current_user.vai_tro == "nhan_vien_moi" and current_user.id != body.employee_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    try:
        supabase = get_supabase()

        # (a) Lay employee info
        emp_result = (
            supabase.table("employees")
            .select("id, full_name, role, department")
            .eq("id", body.employee_id)
            .limit(1)
            .execute()
        )

        if not emp_result.data:
            return _err(f"Employee {body.employee_id} not found")

        employee = emp_result.data[0]

        # (b) Tim conversation dang mo, hoac tao moi
        conv_result = (
            supabase.table("chatbot_conversations")
            .select("id, message_count")
            .eq("employee_id", body.employee_id)
            .is_("ended_at", "null")
            .limit(1)
            .execute()
        )

        if conv_result.data:
            conversation = conv_result.data[0]
            conversation_id = conversation["id"]
            current_count = conversation.get("message_count", 0) or 0
        else:
            # Tao conversation moi
            new_conv = (
                supabase.table("chatbot_conversations")
                .insert({
                    "employee_id": body.employee_id,
                    "channel": "web",
                    "message_count": 0,
                })
                .execute()
            )

            if not new_conv.data:
                return _err("Failed to create conversation")

            conversation_id = new_conv.data[0]["id"]
            current_count = 0

        # (c) Luu user message
        supabase.table("chatbot_messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": body.message,
        }).execute()

        # (d) Goi Agent ML de lay response
        try:
            from src.agent.interface import chat as agent_chat
            agent_result = await agent_chat(body.message, body.employee_id, conversation_id)
            answer = agent_result.get("response", "Xin lỗi, không thể xử lý.")
            sources = agent_result.get("sources", [])
            confidence = agent_result.get("confidence", 0.0)
            actions_taken = agent_result.get("actions_taken", [])
        except ImportError:
            logger.warning("Agent module not installed, using fallback")
            answer = "Agent ML chưa được cài đặt. Vui lòng liên hệ admin."
            sources, confidence, actions_taken = [], 0.0, []
        except Exception as agent_err:
            logger.warning(f"Agent error, fallback: {agent_err}")
            answer = "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại."
            sources, confidence, actions_taken = [], 0.0, []

        # (e) Luu assistant message
        supabase.table("chatbot_messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": answer,
            "sources": sources,
            "confidence_score": confidence,
            "actions_taken": actions_taken,
        }).execute()

        # (f) Update message_count += 2
        supabase.table("chatbot_conversations").update({
            "message_count": current_count + 2,
        }).eq("id", conversation_id).execute()

        return _ok({
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "actions_taken": actions_taken,
            "conversation_id": conversation_id,
        })

    except Exception as e:
        logger.error(f"Chat error: {e}")
        return _err(str(e))


@router.get(
    "/history/{employee_id}",
    summary="Lich su chat",
    description="Lay lich su conversations va messages cua nhan vien. "
                "Limit 50 messages gan nhat.",
)
async def get_chat_history(
    employee_id: str,
    current_user: UserInfo = Depends(get_current_active_user),
):
    """GET /api/chat/history/{employee_id} — lich su chat."""
    if current_user.vai_tro == "nhan_vien_moi" and current_user.id != employee_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    try:
        supabase = get_supabase()

        # Lay conversations cua employee
        conv_result = (
            supabase.table("chatbot_conversations")
            .select("id, started_at, ended_at, message_count")
            .eq("employee_id", employee_id)
            .order("started_at", desc=True)
            .execute()
        )

        conversations = conv_result.data or []

        # Lay messages cho moi conversation
        for conv in conversations:
            msg_result = (
                supabase.table("chatbot_messages")
                .select("id, role, content, sources, created_at")
                .eq("conversation_id", conv["id"])
                .order("created_at")
                .limit(50)
                .execute()
            )
            conv["messages"] = msg_result.data or []

        return _ok({"conversations": conversations})

    except Exception as e:
        logger.error(f"Chat history error: {e}")
        return _err(str(e))


@router.post(
    "/feedback",
    summary="Gui feedback cho cau tra loi",
    description="Danh gia cau tra loi cua chatbot la positive/negative. "
                "Neu negative, tu dong luu vao unanswered_questions.",
)
async def submit_feedback(
    body: FeedbackRequest,
    current_user: UserInfo = Depends(get_current_active_user),
):
    """POST /api/chat/feedback — ghi nhan feedback."""
    try:
        supabase = get_supabase()

        # Validate feedback value
        if body.feedback not in ("positive", "negative"):
            return _err("feedback must be 'positive' or 'negative'")

        # Update feedback tren message
        msg_result = (
            supabase.table("chatbot_messages")
            .update({"feedback": body.feedback})
            .eq("id", body.message_id)
            .execute()
        )

        if not msg_result.data:
            return _err(f"Message {body.message_id} not found")

        msg = msg_result.data[0]

        # Neu negative → luu vao unanswered_questions
        if body.feedback == "negative":
            conversation_id = msg["conversation_id"]

            # Lay conversation de biet employee_id
            conv_result = (
                supabase.table("chatbot_conversations")
                .select("employee_id")
                .eq("id", conversation_id)
                .limit(1)
                .execute()
            )

            employee_id = conv_result.data[0]["employee_id"] if conv_result.data else None

            # Lay message user truoc do (cau hoi goc)
            prev_msg_result = (
                supabase.table("chatbot_messages")
                .select("content")
                .eq("conversation_id", conversation_id)
                .eq("role", "user")
                .lt("created_at", msg["created_at"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )

            question_text = (
                prev_msg_result.data[0]["content"]
                if prev_msg_result.data
                else msg.get("content", "")
            )

            # Insert unanswered_questions
            supabase.table("unanswered_questions").insert({
                "employee_id": employee_id,
                "conversation_id": conversation_id,
                "question_text": question_text,
                "reason": "negative_feedback",
                "confidence_score": msg.get("confidence_score"),
            }).execute()

        return _ok({"message": "Đã ghi nhận phản hồi"})

    except Exception as e:
        logger.error(f"Feedback error: {e}")
        return _err(str(e))
