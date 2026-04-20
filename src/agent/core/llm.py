"""
OpenAI LLM wrapper — generate text and structured JSON.
"""

import json
import logging
from openai import AsyncOpenAI
from src.config import OPENAI_API_KEY
from .config import LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS

logger = logging.getLogger(__name__)

_client = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY not set in .env")
        _client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    return _client


async def generate(
    prompt: str,
    system_instruction: str = "",
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> str:
    """Generate text from OpenAI."""
    client = _get_client()
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=temperature or LLM_TEMPERATURE,
            max_tokens=max_tokens or LLM_MAX_TOKENS,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        logger.error(f"LLM generate error: {e}")
        raise


async def generate_json(
    prompt: str,
    system_instruction: str = "",
) -> dict:
    """Generate structured JSON from OpenAI using JSON mode."""
    client = _get_client()
    messages = []
    sys_msg = (system_instruction or "") + "\nYou MUST respond with valid JSON only."
    messages.append({"role": "system", "content": sys_msg})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS,
            response_format={"type": "json_object"},
        )
        text = response.choices[0].message.content or "{}"
        return json.loads(text)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}")
        return {}
    except Exception as e:
        logger.error(f"LLM generate_json error: {e}")
        raise
