"""
User routes: profile, settings, usage stats, and dashboard.
"""

from __future__ import annotations

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.chat import Conversation, Message
from app.models.subscription import Subscription
from app.models.usage import UsageRecord
from app.schemas.user import DashboardResponse, UserResponse, UserUpdate
from app.services import usage as usage_service

router = APIRouter()


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(current_user=Depends(get_current_active_user)):
    """Return the authenticated user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse, summary="Update profile")
async def update_me(
    body: UserUpdate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile fields."""
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.flush()
    return current_user


@router.get("/me/usage", summary="Get usage statistics")
async def get_usage(
    days: int = 30,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's API usage statistics."""
    return await usage_service.get_user_usage_stats(db, current_user.id, days=days)


@router.get(
    "/me/dashboard",
    response_model=DashboardResponse,
    summary="Get dashboard data",
)
async def get_dashboard(
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated dashboard data for the current user."""
    # Count conversations
    conv_result = await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.user_id == current_user.id
        )
    )
    total_conversations = conv_result.scalar() or 0

    # Count messages across user's conversations
    msg_result = await db.execute(
        select(func.count(Message.id)).where(
            Message.conversation_id.in_(
                select(Conversation.id).where(Conversation.user_id == current_user.id)
            )
        )
    )
    total_messages = msg_result.scalar() or 0

    # Count API calls (usage records)
    api_result = await db.execute(
        select(func.count(UsageRecord.id)).where(UsageRecord.user_id == current_user.id)
    )
    total_api_calls = api_result.scalar() or 0

    # Sum tokens used
    tokens_result = await db.execute(
        select(func.coalesce(func.sum(UsageRecord.tokens_used), 0)).where(
            UsageRecord.user_id == current_user.id
        )
    )
    tokens_used = tokens_result.scalar() or 0

    # Get subscription plan
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status.in_(["active", "trialing"]),
        )
    )
    subscription = sub_result.scalar_one_or_none()
    current_plan = subscription.plan_name if subscription else "free"

    # Calculate today's usage percentage
    quota = settings.PLAN_QUOTAS.get(current_plan, settings.PLAN_QUOTAS["free"])
    today_start = datetime.combine(
        date.today(), datetime.min.time(), tzinfo=timezone.utc
    )
    today_result = await db.execute(
        select(func.count(UsageRecord.id)).where(
            UsageRecord.user_id == current_user.id,
            UsageRecord.created_at >= today_start,
        )
    )
    today_count = today_result.scalar() or 0
    usage_percentage = round((today_count / quota) * 100, 1) if quota > 0 else 0.0

    return DashboardResponse(
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_api_calls=total_api_calls,
        tokens_used=tokens_used,
        current_plan=current_plan,
        usage_percentage=usage_percentage,
    )
