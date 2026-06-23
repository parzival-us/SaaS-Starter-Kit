"""
AI service: OpenAI-compatible chat completions with streaming support.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncGenerator

import httpx

from app.config import settings

logger = logging.getLogger("app.services.ai")

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful AI assistant. Provide clear, concise, and accurate responses."
)


def count_tokens(text: str) -> int:
    """Approximate token count (roughly 4 characters per token)."""
    return max(len(text) // 4, 1)


def build_messages(
    system_prompt: str | None, conversation_messages: list
) -> list[dict]:
    """Build the messages list for the API call.

    *conversation_messages* may be SQLAlchemy ``Message`` objects (with
    ``.role`` / ``.content`` attributes) or plain dicts.
    """
    messages: list[dict] = []

    # System message
    prompt = system_prompt or DEFAULT_SYSTEM_PROMPT
    messages.append({"role": "system", "content": prompt})

    # Conversation history
    for msg in conversation_messages:
        if hasattr(msg, "role"):
            messages.append({"role": msg.role, "content": msg.content})
        else:
            messages.append({"role": msg["role"], "content": msg["content"]})

    return messages


async def chat_completion(
    messages: list[dict], model: str | None = None
) -> str:
    """Send a non-streaming chat completion request and return the response text."""
    target_model = model or settings.OPENAI_MODEL
    url = f"{settings.OPENAI_API_BASE}/chat/completions"

    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        data = response.json()

    return data["choices"][0]["message"]["content"]


async def chat_completion_stream(
    messages: list[dict], model: str | None = None
) -> AsyncGenerator[str, None]:
    """Stream chat completion, yielding content deltas as they arrive."""
    target_model = model or settings.OPENAI_MODEL
    url = f"{settings.OPENAI_API_BASE}/chat/completions"

    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2048,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            url,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if not line:
                    continue
                # SSE lines are prefixed with "data: "
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        logger.warning("Failed to parse SSE chunk: %s", line)
                        continue
