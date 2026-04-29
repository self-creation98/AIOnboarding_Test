"""
Slack Notifications — Module gửi thông báo qua Slack.

Cung cấp các hàm gửi DM, channel message, và notification templates
cho hệ thống AI Onboarding: welcome, reminder (3 tiers), stakeholder, risk alert.

Tất cả functions fail silently (log warning, không raise) để không
ảnh hưởng flow chính nếu Slack gửi thất bại.

Usage:
    from src.slack_bot.notifications import send_welcome, send_reminder_tier1
    send_welcome("Nguyễn Văn A", "a@company.vn", 12)
"""

import os
import logging
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────────────

_client: WebClient | None = None
SLACK_HR_CHANNEL = os.environ.get("SLACK_HR_CHANNEL", "#hr-support")


def _get_client() -> WebClient:
    """Lazy init Slack WebClient."""
    global _client
    if _client is None:
        token = os.environ.get("SLACK_BOT_TOKEN")
        if not token:
            raise ValueError("SLACK_BOT_TOKEN chưa set trong .env")
        _client = WebClient(token=token)
    return _client


# ─── Lookup helpers ──────────────────────────────────────────────────────────

# Cache email → Slack user ID để giảm API calls
_user_id_cache: dict[str, str] = {}


def _lookup_user_by_email(email: str) -> str | None:
    """
    Tìm Slack user ID theo email.
    Returns user ID hoặc None nếu không tìm thấy.
    """
    if email in _user_id_cache:
        return _user_id_cache[email]

    try:
        client = _get_client()
        result = client.users_lookupByEmail(email=email)
        if result["ok"]:
            user_id = result["user"]["id"]
            _user_id_cache[email] = user_id
            return user_id
    except SlackApiError as e:
        if e.response["error"] == "users_not_found":
            logger.warning(f"Slack user not found for email: {email}")
        else:
            logger.warning(f"Slack lookup failed for {email}: {e.response['error']}")
    except Exception as e:
        logger.warning(f"Slack lookup error for {email}: {e}")
    return None


# ─── Core send functions ─────────────────────────────────────────────────────


def send_dm(email: str, message: str, blocks: list[dict] | None = None) -> bool:
    """
    Gửi Direct Message cho user theo email.

    Args:
        email: Email của người nhận (phải trùng với Slack profile).
        message: Nội dung text (fallback nếu có blocks).
        blocks: Optional Block Kit blocks.

    Returns:
        True nếu gửi thành công, False nếu thất bại.
    """
    try:
        user_id = _lookup_user_by_email(email)
        if not user_id:
            logger.warning(f"Cannot send DM: user not found for {email}")
            return False

        client = _get_client()

        # Mở DM channel
        dm_result = client.conversations_open(users=[user_id])
        if not dm_result["ok"]:
            logger.warning(f"Cannot open DM channel for {email}")
            return False

        channel_id = dm_result["channel"]["id"]

        kwargs = {"channel": channel_id, "text": message}
        if blocks:
            kwargs["blocks"] = blocks

        client.chat_postMessage(**kwargs)
        logger.info(f"DM sent to {email}")
        return True

    except SlackApiError as e:
        logger.warning(f"Slack DM failed for {email}: {e.response['error']}")
        return False
    except Exception as e:
        logger.warning(f"Send DM error for {email}: {e}")
        return False


def send_channel(channel: str, message: str, blocks: list[dict] | None = None) -> bool:
    """
    Gửi message vào Slack channel.

    Args:
        channel: Channel name (#general) hoặc channel ID.
        message: Nội dung text (fallback nếu có blocks).
        blocks: Optional Block Kit blocks.

    Returns:
        True nếu gửi thành công, False nếu thất bại.
    """
    try:
        client = _get_client()
        kwargs = {"channel": channel, "text": message}
        if blocks:
            kwargs["blocks"] = blocks

        client.chat_postMessage(**kwargs)
        logger.info(f"Channel message sent to {channel}")
        return True

    except SlackApiError as e:
        logger.warning(f"Slack channel message failed for {channel}: {e.response['error']}")
        return False
    except Exception as e:
        logger.warning(f"Send channel error for {channel}: {e}")
        return False


# ─── Notification templates ──────────────────────────────────────────────────


def send_welcome(name: str, email: str, checklist_count: int) -> bool:
    """
    Gửi DM chào mừng nhân viên mới.

    Args:
        name: Tên nhân viên.
        email: Email nhân viên (dùng để tìm Slack user).
        checklist_count: Số lượng checklist items.
    """
    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🎉 Chào mừng bạn đến với Company!",
                "emoji": True,
            },
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"Xin chào *{name}*! 👋\n\n"
                    f"Chúc mừng bạn đã gia nhập đội ngũ Company. "
                    f"Bạn có *{checklist_count} việc* cần hoàn thành trong kế hoạch onboarding.\n\n"
                    f"Gõ *`checklist`* bất cứ lúc nào để xem tiến độ và đánh dấu hoàn thành."
                ),
            },
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    "💡 *Mẹo nhanh:*\n"
                    "• Gõ bất kỳ câu hỏi nào về công ty — tôi sẽ tìm câu trả lời cho bạn\n"
                    "• Gõ *`checklist`* — xem danh sách việc cần làm\n"
                    "• Hỏi về nghỉ phép, lương thưởng, IT support — tôi biết hết! 😊"
                ),
            },
        },
    ]

    return send_dm(email, f"Chào mừng {name} đến với Company!", blocks=blocks)


def send_reminder_tier1(
    email: str, name: str, task: str, overdue_days: int
) -> bool:
    """
    Tier 1: Nhắc nhở nhẹ cho nhân viên (task quá hạn 1-2 ngày).

    Args:
        email: Email nhân viên.
        name: Tên nhân viên.
        task: Tên task quá hạn.
        overdue_days: Số ngày quá hạn.
    """
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"👋 Chào *{name}*, nhắc bạn nhẹ!\n\n"
                    f"Task *{task}* đã quá hạn *{overdue_days} ngày*.\n"
                    f"Hãy hoàn thành sớm nhé — gõ *`checklist`* để xem chi tiết."
                ),
            },
        },
    ]

    return send_dm(
        email,
        f"Nhắc nhở: {task} đã quá hạn {overdue_days} ngày",
        blocks=blocks,
    )


def send_reminder_tier2(
    manager_email: str,
    manager_name: str,
    employee_name: str,
    task: str,
    overdue_days: int,
) -> bool:
    """
    Tier 2: Escalation — nhắc Manager rằng NV có task quá hạn (3-5 ngày).

    Args:
        manager_email: Email manager.
        manager_name: Tên manager.
        employee_name: Tên nhân viên.
        task: Tên task quá hạn.
        overdue_days: Số ngày quá hạn.
    """
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"⚠️ *Escalation — Nhân viên cần chú ý*\n\n"
                    f"Chào *{manager_name}*, nhân viên *{employee_name}* "
                    f"có task onboarding quá hạn *{overdue_days} ngày*:\n\n"
                    f"📌 *{task}*\n\n"
                    f"Vui lòng liên hệ nhân viên để hỗ trợ hoàn thành."
                ),
            },
        },
    ]

    return send_dm(
        manager_email,
        f"Escalation: {employee_name} — {task} quá hạn {overdue_days} ngày",
        blocks=blocks,
    )


def send_reminder_tier3(
    employee_name: str, task: str, overdue_days: int
) -> bool:
    """
    Tier 3: Alert HR channel — task quá hạn nghiêm trọng (5+ ngày).

    Args:
        employee_name: Tên nhân viên.
        task: Tên task quá hạn.
        overdue_days: Số ngày quá hạn.
    """
    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"🚨 *Alert — Task onboarding quá hạn nghiêm trọng*\n\n"
                    f"*Nhân viên:* {employee_name}\n"
                    f"*Task:* {task}\n"
                    f"*Quá hạn:* {overdue_days} ngày\n\n"
                    f"Cần HR can thiệp hỗ trợ nhân viên."
                ),
            },
        },
    ]

    return send_channel(
        SLACK_HR_CHANNEL,
        f"🚨 {employee_name}: {task} quá hạn {overdue_days} ngày",
        blocks=blocks,
    )


def send_stakeholder_notification(
    channel: str,
    employee_name: str,
    role: str,
    department: str,
    tasks: list[str],
) -> bool:
    """
    Thông báo stakeholder (IT/Admin/Manager) cần chuẩn bị cho NV mới.

    Args:
        channel: Channel hoặc email cá nhân.
        employee_name: Tên nhân viên mới.
        role: Vai trò.
        department: Phòng ban.
        tasks: Danh sách tasks cần chuẩn bị.
    """
    task_list = "\n".join(f"• {t}" for t in tasks)

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"📢 *Nhân viên mới cần chuẩn bị*\n\n"
                    f"*Tên:* {employee_name}\n"
                    f"*Vai trò:* {role}\n"
                    f"*Phòng ban:* {department}\n\n"
                    f"*Việc cần làm:*\n{task_list}"
                ),
            },
        },
    ]

    # Nếu channel là email → gửi DM, ngược lại gửi channel
    if "@" in channel:
        return send_dm(
            channel,
            f"Chuẩn bị onboarding cho {employee_name} ({role})",
            blocks=blocks,
        )
    else:
        return send_channel(
            channel,
            f"Chuẩn bị onboarding cho {employee_name} ({role})",
            blocks=blocks,
        )


def send_risk_alert(
    employee_name: str, risk_factors: list[str]
) -> bool:
    """
    Gửi alert vào HR channel khi phát hiện NV at-risk.

    Args:
        employee_name: Tên nhân viên.
        risk_factors: Danh sách yếu tố rủi ro.
    """
    factors_text = "\n".join(f"• {f}" for f in risk_factors)

    blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"🔴 *Nhân viên cần chú ý — At Risk*\n\n"
                    f"*Nhân viên:* {employee_name}\n\n"
                    f"*Yếu tố rủi ro:*\n{factors_text}\n\n"
                    f"_Hệ thống AI phát hiện tự động. "
                    f"Vui lòng liên hệ nhân viên hoặc manager để hỗ trợ._"
                ),
            },
        },
    ]

    return send_channel(
        SLACK_HR_CHANNEL,
        f"🔴 At-risk: {employee_name} — {', '.join(risk_factors[:2])}",
        blocks=blocks,
    )
