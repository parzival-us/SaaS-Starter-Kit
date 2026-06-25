"""
Chat routes: conversations and messages with streaming AI responses.
"""

from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.chat import Conversation, Message
from app.models.prompt_template import PromptTemplate
from app.schemas.chat import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services import ai as ai_service
from app.services import usage as usage_service

logger = logging.getLogger("app.api.chat")

router = APIRouter()


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new conversation",
)
async def create_conversation(
    body: ConversationCreate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation for the current user."""
    conversation = Conversation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=body.title or "New Conversation",
        model=body.model or settings.OPENAI_MODEL,
    )
    db.add(conversation)
    await db.flush()

    return ConversationResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        model=conversation.model,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=0,
    )


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List conversations",
)
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's conversations ordered by most recent."""
    # Total count
    count_result = await db.execute(select(func.count(Conversation.id)).where(Conversation.user_id == current_user.id))
    total = count_result.scalar() or 0

    # Fetch conversations with message count
    msg_count_subq = (
        select(
            Message.conversation_id,
            func.count(Message.id).label("msg_count"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    result = await db.execute(
        select(Conversation, func.coalesce(msg_count_subq.c.msg_count, 0))
        .outerjoin(
            msg_count_subq,
            Conversation.id == msg_count_subq.c.conversation_id,
        )
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .offset(skip)
        .limit(limit)
    )

    conversations = []
    for conv, msg_count in result.all():
        conversations.append(
            ConversationResponse(
                id=conv.id,
                user_id=conv.user_id,
                title=conv.title,
                model=conv.model,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count,
            )
        )

    return ConversationListResponse(conversations=conversations, total=total)


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    summary="Get conversation with messages",
)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a conversation and all its messages."""
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation",
        )

    messages = [
        MessageResponse(
            id=m.id,
            conversation_id=m.conversation_id,
            role=m.role,
            content=m.content,
            tokens=m.tokens,
            created_at=m.created_at,
        )
        for m in conversation.messages
    ]

    return ConversationDetailResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        model=conversation.model,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages),
        messages=messages,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    summary="Send a message and get AI response (streaming SSE)",
)
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageCreate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a user message and stream the AI assistant's response via SSE."""
    # Fetch and verify conversation
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this conversation",
        )

    # If template_id is provided, fetch the template
    system_prompt = None
    if body.template_id:
        tmpl_result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == body.template_id))
        template = tmpl_result.scalar_one_or_none()
        if template:
            system_prompt = template.content
            template.usage_count += 1
            await db.flush()

    # Save user message
    user_msg = Message(
        id=uuid.uuid4(),
        conversation_id=conversation.id,
        role="user",
        content=body.content,
        tokens=ai_service.count_tokens(body.content),
    )
    db.add(user_msg)
    await db.flush()

    # Build message history
    api_messages = ai_service.build_messages(system_prompt, conversation.messages)

    async def event_stream():
        full_response = ""
        try:
            async for chunk in ai_service.chat_completion_stream(api_messages, model=conversation.model):
                full_response += chunk
                # SSE format
                data = json.dumps({"content": chunk})
                yield f"data: {data}\n\n"
        except Exception as exc:
            logger.error("AI streaming error: %s", exc)
            error_data = json.dumps({"error": str(exc)})
            yield f"data: {error_data}\n\n"

        # Save assistant message after stream completes
        assistant_tokens = ai_service.count_tokens(full_response)
        assistant_msg = Message(
            id=uuid.uuid4(),
            conversation_id=conversation.id,
            role="assistant",
            content=full_response,
            tokens=assistant_tokens,
        )

        # We need a fresh session since the streaming may have committed
        from app.database import async_session_factory

        async with async_session_factory() as save_db:
            try:
                save_db.add(assistant_msg)
                # Track usage
                total_tokens = user_msg.tokens + assistant_tokens
                await usage_service.track_usage(
                    save_db,
                    current_user.id,
                    endpoint=f"/chat/conversations/{conversation_id}/messages",
                    method="POST",
                    tokens_used=total_tokens,
                    cost=total_tokens * 0.00003,  # approximate cost per token
                )
                await save_db.commit()
            except Exception:
                await save_db.rollback()
                logger.exception("Failed to save assistant message")

        # Send done signal
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete(
    "/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    if conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this conversation",
        )

    await db.delete(conversation)
    await db.flush()
