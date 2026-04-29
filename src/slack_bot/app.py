"""
Slack Bot — AI Onboarding Assistant (Socket Mode)

Nhận message từ user qua DM hoặc @mention trong channel,
tra cứu employee theo email Slack, gọi RAG pipeline và reply.

Chạy: python -m src.slack_bot.app
"""

import os
import re
import logging
import httpx
from dotenv import load_dotenv
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")

# ─── Config ──────────────────────────────────────────────────────────────────

BACKEND_BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")
CHAT_API_TIMEOUT = 30  # seconds
SLACK_HR_CHANNEL = os.environ.get("SLACK_HR_CHANNEL", "#hr-support")

# Keywords kích hoạt hiển thị checklist thay vì gọi chat
CHECKLIST_KEYWORDS = [
    "checklist", "việc cần làm", "tôi cần làm gì",
    "cần làm gì", "danh sách công việc", "to do", "todo",
]

# ─── Init Slack App (Socket Mode) ────────────────────────────────────────────

app = App(token=os.environ["SLACK_BOT_TOKEN"])


# ─── Supabase helpers ────────────────────────────────────────────────────────

def _get_supabase():
    """Lazy import Supabase client để tránh circular import."""
    from src.backend.database import get_supabase
    return get_supabase()


def _lookup_employee_by_email(email: str) -> dict | None:
    """
    Tìm employee trong bảng employees (Supabase) theo email.
    Returns dict employee hoặc None nếu không tìm thấy.
    """
    try:
        supabase = _get_supabase()
        result = (
            supabase.table("employees")
            .select("id, email, full_name, vai_tro, department")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error(f"Supabase lookup failed for {email}: {e}")
        return None


# ─── Slack user → email ──────────────────────────────────────────────────────

# Cache email per Slack user_id trong session (tránh gọi API lặp lại)
_email_cache: dict[str, str] = {}


def _get_user_email(client, user_id: str) -> str | None:
    """
    Lấy email của Slack user từ users.info API.
    Cache kết quả để tránh rate limit.
    """
    if user_id in _email_cache:
        return _email_cache[user_id]

    try:
        result = client.users_info(user=user_id)
        if result["ok"]:
            email = result["user"]["profile"].get("email")
            if email:
                _email_cache[user_id] = email
            return email
    except Exception as e:
        logger.error(f"Failed to get email for Slack user {user_id}: {e}")
    return None


# ─── Chat API call ───────────────────────────────────────────────────────────

def _call_chat_api(employee_id: str, message: str) -> dict:
    """
    Gọi POST /api/chat trên backend.
    Returns dict với keys: answer, sources, confidence, ...
    Raises exception nếu fail.
    """
    url = f"{BACKEND_BASE_URL}/api/chat/slack"
    payload = {
        "employee_id": employee_id,
        "message": message,
    }

    with httpx.Client(timeout=CHAT_API_TIMEOUT) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    if not data.get("success"):
        raise ValueError(data.get("error", "Unknown API error"))

    return data.get("data", {})


# ─── Format reply (Block Kit) ────────────────────────────────────────────────

def _build_blocks(api_response: dict) -> list[dict]:
    """
    Build Slack Block Kit blocks từ API response.
    - Section block: answer
    - Context block: sources (italic, bulleted)
    - Actions block: feedback buttons (👍 / 👎)
    - Warning + HR button nếu confidence < 0.5
    """
    answer = api_response.get("answer", "Không có câu trả lời.")
    sources = api_response.get("sources", [])
    confidence = api_response.get("confidence", 1.0)
    conversation_id = api_response.get("conversation_id", "")

    blocks = []

    # ── Answer section ──
    blocks.append({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": answer,
        }
    })

    # ── Sources context ──
    if sources:
        source_lines = []
        for src in sources:
            if isinstance(src, str):
                source_lines.append(f"• _{src}_")
            elif isinstance(src, dict):
                title = src.get("title", src.get("source", "N/A"))
                source_lines.append(f"• _{title}_")

        blocks.append({"type": "divider"})
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": "📎 *Nguồn tham khảo:*\n" + "\n".join(source_lines),
                }
            ]
        })

    # ── Low confidence warning ──
    if confidence < 0.5:
        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "⚠️ _Câu trả lời này có độ tin cậy thấp. "
                        "Vui lòng xác nhận lại với Phòng HR nếu cần._",
            },
        })
        blocks.append({
            "type": "actions",
            "block_id": f"hr_contact_{conversation_id}",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "📞 Liên hệ HR",
                        "emoji": True,
                    },
                    "action_id": "contact_hr",
                    "value": conversation_id,
                }
            ]
        })

    # ── Feedback buttons ──
    blocks.append({"type": "divider"})
    blocks.append({
        "type": "actions",
        "block_id": f"feedback_{conversation_id}",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "👍 Hữu ích",
                    "emoji": True,
                },
                "style": "primary",
                "action_id": "feedback_positive",
                "value": conversation_id,
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "👎 Chưa tốt",
                    "emoji": True,
                },
                "style": "danger",
                "action_id": "feedback_negative",
                "value": conversation_id,
            },
        ]
    })

    return blocks


# ─── Action handlers (Button clicks) ────────────────────────────────────────

@app.action("feedback_positive")
def handle_feedback_positive(ack, body, client, logger):
    """Xử lý khi user bấm 👍 Hữu ích."""
    ack()
    conversation_id = body["actions"][0].get("value", "")
    user_id = body["user"]["id"]
    logger.info(f"Positive feedback from <@{user_id}> on conversation {conversation_id}")

    # Gọi feedback API
    try:
        _submit_feedback(conversation_id, "positive")
    except Exception as e:
        logger.error(f"Failed to submit positive feedback: {e}")

    # Update message: bỏ buttons, hiện confirmation
    client.chat_update(
        channel=body["channel"]["id"],
        ts=body["message"]["ts"],
        blocks=_replace_feedback_block(body["message"]["blocks"], "✅ Cảm ơn đã đánh giá!"),
        text="Cảm ơn đã đánh giá!",
    )


@app.action("feedback_negative")
def handle_feedback_negative(ack, body, client, logger):
    """Xử lý khi user bấm 👎 Chưa tốt."""
    ack()
    conversation_id = body["actions"][0].get("value", "")
    user_id = body["user"]["id"]
    logger.info(f"Negative feedback from <@{user_id}> on conversation {conversation_id}")

    # Gọi feedback API
    try:
        _submit_feedback(conversation_id, "negative")
    except Exception as e:
        logger.error(f"Failed to submit negative feedback: {e}")

    # Update message: bỏ buttons, hiện acknowledgement
    client.chat_update(
        channel=body["channel"]["id"],
        ts=body["message"]["ts"],
        blocks=_replace_feedback_block(
            body["message"]["blocks"],
            "📝 Đã ghi nhận để cải thiện"
        ),
        text="Đã ghi nhận để cải thiện.",
    )


@app.action("contact_hr")
def handle_contact_hr(ack, body, say, client, logger):
    """
    Xử lý nút Liên hệ HR:
    1. Gửi thông báo vào channel #hr-support
    2. Reply cho user xác nhận đã chuyển
    3. Update message bỏ nút HR
    """
    ack()
    user_id = body["user"]["id"]
    conversation_id = body["actions"][0].get("value", "")
    channel_id = body["channel"]["id"]

    logger.info(f"HR contact request from <@{user_id}> (conversation: {conversation_id})")

    # Lấy nội dung câu hỏi gốc từ message blocks (section đầu tiên)
    original_question = ""
    for block in body.get("message", {}).get("blocks", []):
        if block.get("type") == "section" and block.get("text", {}).get("type") == "mrkdwn":
            original_question = block["text"]["text"]
            break

    # 1. Gửi thông báo vào channel HR
    try:
        client.chat_postMessage(
            channel=SLACK_HR_CHANNEL,
            text=f"Nhân viên <@{user_id}> cần hỗ trợ từ HR",
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "🔔 *Yêu cầu hỗ trợ HR từ Chatbot*",
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": f"*Nhân viên:*\n<@{user_id}>",
                        },
                        {
                            "type": "mrkdwn",
                            "text": f"*Conversation:*\n`{conversation_id[:8]}...`" if conversation_id else "*Conversation:*\nN/A",
                        },
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Câu hỏi/Nội dung:*\n>{original_question[:500]}" if original_question else "*Câu hỏi:*\n_Không có nội dung_",
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "_Chatbot không thể trả lời chính xác câu hỏi này. Vui lòng liên hệ nhân viên để hỗ trợ._",
                        }
                    ]
                },
            ]
        )
    except Exception as e:
        logger.error(f"Failed to post to HR channel ({SLACK_HR_CHANNEL}): {e}")

    # 2. Reply cho user
    say(f"<@{user_id}> ✅ Đã chuyển cho HR. Phòng Nhân sự sẽ liên hệ bạn sớm nhất có thể!")

    # 3. Update message: bỏ nút HR, thay bằng confirmation
    try:
        client.chat_update(
            channel=channel_id,
            ts=body["message"]["ts"],
            blocks=_replace_hr_block(body["message"]["blocks"]),
            text="Đã chuyển cho HR.",
        )
    except Exception as e:
        logger.error(f"Failed to update HR button message: {e}")


def _submit_feedback(conversation_id: str, feedback: str) -> None:
    """Gọi backend API ghi nhận feedback."""
    if not conversation_id:
        return

    # Tìm message cuối cùng trong conversation để submit feedback
    try:
        supabase = _get_supabase()
        msg_result = (
            supabase.table("chatbot_messages")
            .select("id")
            .eq("conversation_id", conversation_id)
            .eq("role", "assistant")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if msg_result.data:
            message_id = msg_result.data[0]["id"]
            url = f"{BACKEND_BASE_URL}/api/chat/feedback"
            with httpx.Client(timeout=10) as http:
                http.post(url, json={"message_id": message_id, "feedback": feedback})
    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")


def _replace_feedback_block(blocks: list[dict], message: str) -> list[dict]:
    """Thay feedback actions block (buttons) bằng context block."""
    new_blocks = []
    for block in blocks:
        if block.get("type") == "actions" and "feedback_" in block.get("block_id", ""):
            new_blocks.append({
                "type": "context",
                "elements": [{
                    "type": "mrkdwn",
                    "text": message,
                }]
            })
        else:
            new_blocks.append(block)
    return new_blocks


def _replace_hr_block(blocks: list[dict]) -> list[dict]:
    """Thay HR contact actions block bằng confirmation."""
    new_blocks = []
    for block in blocks:
        if block.get("type") == "actions" and "hr_contact_" in block.get("block_id", ""):
            new_blocks.append({
                "type": "context",
                "elements": [{
                    "type": "mrkdwn",
                    "text": "✅ _Đã chuyển yêu cầu cho Phòng HR_",
                }]
            })
        else:
            new_blocks.append(block)
    return new_blocks


# ─── Checklist feature ───────────────────────────────────────────────────────

def _is_checklist_request(text: str) -> bool:
    """Kiểm tra message có phải yêu cầu xem checklist không."""
    lower = text.lower().strip()
    return any(kw in lower for kw in CHECKLIST_KEYWORDS)


def _fetch_checklist(employee_id: str) -> dict | None:
    """
    Lấy checklist từ Supabase trực tiếp (không qua HTTP API, tránh auth).
    Returns dict {plan_id, status, completion_percentage, items: [...]}
    """
    try:
        supabase = _get_supabase()

        plan_result = (
            supabase.table("onboarding_plans")
            .select("id, status, completion_percentage, total_items, completed_items")
            .eq("employee_id", employee_id)
            .limit(1)
            .execute()
        )

        if not plan_result.data:
            return None

        plan = plan_result.data[0]

        items_result = (
            supabase.table("checklist_items")
            .select(
                "id, title, category, week, deadline_date, "
                "owner, is_mandatory, status, completed_at"
            )
            .eq("plan_id", plan["id"])
            .order("week")
            .order("sort_order")
            .execute()
        )

        return {
            "plan_id": plan["id"],
            "status": plan["status"],
            "completion_percentage": plan.get("completion_percentage", 0),
            "total_items": plan.get("total_items", 0),
            "completed_items": plan.get("completed_items", 0),
            "items": items_result.data or [],
        }
    except Exception as e:
        logger.error(f"Fetch checklist error for {employee_id}: {e}")
        return None


def _build_checklist_blocks(checklist: dict, employee_id: str) -> list[dict]:
    """
    Build Block Kit blocks cho checklist:
    - Header: tên + progress bar + %
    - Items chia theo tuần
    - Items chưa xong có nút "✓ Xong"
    """
    pct = checklist.get("completion_percentage", 0)
    total = checklist.get("total_items", 0)
    done = checklist.get("completed_items", 0)
    items = checklist.get("items", [])

    # Progress bar visual
    filled = int(pct / 10)
    bar = "█" * filled + "░" * (10 - filled)

    blocks = []

    # ── Header ──
    blocks.append({
        "type": "header",
        "text": {
            "type": "plain_text",
            "text": "📋 Checklist Onboarding",
            "emoji": True,
        }
    })
    blocks.append({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": f"*Tiến độ:* {bar} *{pct:.0f}%* ({done}/{total})",
        }
    })
    blocks.append({"type": "divider"})

    # ── Items grouped by week ──
    weeks: dict[int, list[dict]] = {}
    for item in items:
        week = item.get("week", 0)
        weeks.setdefault(week, []).append(item)

    for week_num in sorted(weeks.keys()):
        week_items = weeks[week_num]
        week_label = "Pre-boarding" if week_num == 0 else f"Tuần {week_num}"

        blocks.append({
            "type": "context",
            "elements": [{
                "type": "mrkdwn",
                "text": f"*── {week_label} ──*",
            }]
        })

        for item in week_items:
            is_done = item.get("status") == "hoan_thanh"
            icon = "✅" if is_done else "⬜"
            mandatory = " ⚠️" if item.get("is_mandatory") and not is_done else ""
            deadline = item.get("deadline_date", "")
            deadline_str = f" (hạn: {deadline})" if deadline and not is_done else ""

            item_text = f"{icon} {item['title']}{mandatory}{deadline_str}"

            if is_done:
                # Item đã hoàn thành — chỉ hiện text
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"~{item_text}~" if is_done else item_text,
                    }
                })
            else:
                # Item chưa xong — có nút "✓ Xong"
                blocks.append({
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": item_text,
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "✓ Xong",
                            "emoji": True,
                        },
                        "style": "primary",
                        "action_id": "complete_checklist_item",
                        "value": f"{item['id']}|{employee_id}",
                    }
                })

    return blocks


@app.action("complete_checklist_item")
def handle_complete_checklist_item(ack, body, client, say, logger):
    """
    Xử lý khi user bấm "✓ Xong" trên 1 checklist item.
    Gọi PATCH /api/checklist/items/{id}/complete rồi refresh lại checklist.
    """
    ack()
    value = body["actions"][0].get("value", "")
    parts = value.split("|")
    if len(parts) != 2:
        logger.error(f"Invalid checklist action value: {value}")
        return

    item_id, employee_id = parts
    user_id = body["user"]["id"]

    logger.info(f"Checklist complete: item={item_id}, employee={employee_id}, user=<@{user_id}>")

    # Gọi Supabase trực tiếp để complete item (tránh auth)
    try:
        from datetime import datetime
        supabase = _get_supabase()

        # Update item status
        item_result = (
            supabase.table("checklist_items")
            .update({
                "status": "hoan_thanh",
                "completed_at": datetime.now().isoformat(),
                "completed_by": employee_id,
            })
            .eq("id", item_id)
            .execute()
        )

        if not item_result.data:
            say(f"<@{user_id}> ❌ Không tìm thấy task này.")
            return

        plan_id = item_result.data[0]["plan_id"]

        # Recalculate completion percentage
        completed_result = (
            supabase.table("checklist_items")
            .select("id", count="exact")
            .eq("plan_id", plan_id)
            .eq("status", "hoan_thanh")
            .execute()
        )
        completed_count = completed_result.count if completed_result.count is not None else 0

        plan_result = (
            supabase.table("onboarding_plans")
            .select("total_items")
            .eq("id", plan_id)
            .limit(1)
            .execute()
        )
        total = plan_result.data[0]["total_items"] if plan_result.data else 1
        pct = round((completed_count / total) * 100, 1) if total > 0 else 0

        supabase.table("onboarding_plans").update({
            "completed_items": completed_count,
            "completion_percentage": pct,
        }).eq("id", plan_id).execute()

        # Refresh checklist blocks
        checklist = _fetch_checklist(employee_id)
        if checklist:
            blocks = _build_checklist_blocks(checklist, employee_id)
            client.chat_update(
                channel=body["channel"]["id"],
                ts=body["message"]["ts"],
                blocks=blocks,
                text="Checklist Onboarding",
            )

        title = item_result.data[0].get("title", "task")
        say(f"<@{user_id}> ✅ Đã hoàn thành: *{title}*! ({pct:.0f}% tổng tiến độ)")

    except Exception as e:
        logger.error(f"Complete checklist item error: {e}")
        say(f"<@{user_id}> ❌ Có lỗi khi cập nhật. Vui lòng thử lại.")


# ─── Core handler ────────────────────────────────────────────────────────────

def _handle_user_message(event: dict, say, client) -> None:
    """
    Logic chính xử lý message từ user (dùng chung cho DM và @mention).

    Flow:
    1. Lấy email user từ Slack API (users.info)
    2. Tìm employee trong bảng employees (Supabase) theo email
    3. Nếu không tìm thấy → reply "Tài khoản không có trong hệ thống"
    4. Nếu tìm thấy → gọi POST /api/chat/slack
    5. Reply answer (Block Kit) + sources + feedback buttons
    """
    user_id = event.get("user", "unknown")
    user_text = event.get("text", "").strip()

    # Loại bỏ phần @mention nếu có
    cleaned_text = re.sub(r"<@[A-Z0-9]+>\s*", "", user_text).strip()

    if not cleaned_text:
        say(f"<@{user_id}> Bạn cần hỏi gì không? Hãy gõ câu hỏi nhé! 😊")
        return

    # Step 1: Lấy email từ Slack
    email = _get_user_email(client, user_id)
    if not email:
        say(f"<@{user_id}> Không thể lấy thông tin email từ tài khoản Slack của bạn. "
            "Vui lòng kiểm tra cài đặt Slack profile.")
        return

    logger.info(f"Message from {email} (Slack: {user_id}): {cleaned_text}")

    # Step 2: Tìm employee trong Supabase
    employee = _lookup_employee_by_email(email)
    if not employee:
        say(f"<@{user_id}> Tài khoản email `{email}` không có trong hệ thống nhân sự. "
            "Vui lòng liên hệ Phòng HR (hr@company.vn) để được hỗ trợ.")
        return

    # Step 2.5: Kiểm tra checklist keywords — xử lý riêng, không gọi chat
    if _is_checklist_request(cleaned_text):
        checklist = _fetch_checklist(employee["id"])
        if not checklist:
            say(f"<@{user_id}> Bạn chưa có checklist onboarding. Liên hệ HR để được tạo kế hoạch.")
            return

        blocks = _build_checklist_blocks(checklist, employee["id"])
        say(blocks=blocks, text="Checklist Onboarding")
        return

    # Step 3: Gọi Chat API
    try:
        api_response = _call_chat_api(
            employee_id=employee["id"],
            message=cleaned_text,
        )

        # Step 4: Build Block Kit và reply
        blocks = _build_blocks(api_response)
        fallback_text = api_response.get("answer", "Câu trả lời từ AI Onboarding Assistant")
        say(blocks=blocks, text=fallback_text)

    except httpx.TimeoutException:
        say(f"<@{user_id}> ⏱️ Hệ thống đang bận, vui lòng thử lại sau ít phút.")
    except httpx.HTTPStatusError as e:
        logger.error(f"Chat API HTTP error: {e.response.status_code} — {e.response.text}")
        say(f"<@{user_id}> ❌ Lỗi kết nối hệ thống (HTTP {e.response.status_code}). "
            "Vui lòng thử lại hoặc liên hệ IT support.")
    except Exception as e:
        logger.error(f"Chat error for {email}: {e}")
        say(f"<@{user_id}> ❌ Có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.")


# ─── Bot message filter ──────────────────────────────────────────────────────

def _is_bot_message(event: dict) -> bool:
    """Bỏ qua message từ bot để tránh infinite loop."""
    return event.get("bot_id") is not None or event.get("subtype") == "bot_message"


# ─── Event: Direct Message (DM) ─────────────────────────────────────────────

@app.event("message")
def handle_dm(event: dict, say, client, logger):
    """
    Xử lý tin nhắn DM gửi trực tiếp cho bot.
    Slack gửi event "message" với channel_type="im" khi user DM bot.
    """
    if _is_bot_message(event):
        return

    # Chỉ xử lý DM (im) — @mention trong channel xử lý ở handler khác
    channel_type = event.get("channel_type", "")
    if channel_type != "im":
        return

    _handle_user_message(event, say, client)


# ─── Event: @mention trong channel ───────────────────────────────────────────

@app.event("app_mention")
def handle_mention(event: dict, say, client, logger):
    """
    Xử lý khi user @mention bot trong channel.
    Slack gửi event "app_mention" riêng biệt.
    """
    if _is_bot_message(event):
        return

    _handle_user_message(event, say, client)


# ─── Entrypoint ──────────────────────────────────────────────────────────────

def main():
    """Khởi chạy bot qua Socket Mode (không cần public URL)."""
    app_token = os.environ.get("SLACK_APP_TOKEN")
    if not app_token:
        raise ValueError(
            "SLACK_APP_TOKEN chưa set. Cần App-Level Token (xapp-...) cho Socket Mode.\n"
            "Tạo tại: https://api.slack.com/apps → Basic Information → App-Level Tokens"
        )

    logger.info("🚀 Slack Bot starting (Socket Mode)...")
    logger.info(f"   Backend URL: {BACKEND_BASE_URL}")
    logger.info(f"   Chat API timeout: {CHAT_API_TIMEOUT}s")
    handler = SocketModeHandler(app, app_token)
    handler.start()


if __name__ == "__main__":
    main()
