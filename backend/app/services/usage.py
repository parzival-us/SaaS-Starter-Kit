"""
Usage tracking service: record API usage, compute stats, check plan quotas.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.subscription import Subscription
from app.models.usage import UsageRecord
from app.models.user import User


async def track_usage(
    db: AsyncSession,
    user_id: uuid.UUID,
    endpoint: str,
    method: str,
    tokens_used: int = 0,
    cost: float = 0.0,
) -> UsageRecord:
    """Create a usage record for an API request."""
    record = UsageRecord(
        id=uuid.uuid4(),
        user_id=user_id,
        endpoint=endpoint,
        method=method,
        tokens_used=tokens_used,
        cost=cost,
    )
    db.add(record)
    await db.flush()
    return record


async def get_user_usage_stats(db: AsyncSession, user_id: uuid.UUID, days: int = 30) -> dict:
    """Return usage statistics for a user over the last *days* days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Aggregate totals
    totals_result = await db.execute(
        select(
            func.count(UsageRecord.id).label("total_requests"),
            func.coalesce(func.sum(UsageRecord.tokens_used), 0).label("total_tokens"),
            func.coalesce(func.sum(UsageRecord.cost), 0.0).label("total_cost"),
        ).where(
            UsageRecord.user_id == user_id,
            UsageRecord.created_at >= cutoff,
        )
    )
    row = totals_result.one()
    total_requests = row.total_requests
    total_tokens = row.total_tokens
    total_cost = float(row.total_cost)

    # Daily breakdown
    daily_result = await db.execute(
        select(
            func.date_trunc("day", UsageRecord.created_at).label("day"),
            func.count(UsageRecord.id).label("requests"),
            func.coalesce(func.sum(UsageRecord.tokens_used), 0).label("tokens"),
        )
        .where(
            UsageRecord.user_id == user_id,
            UsageRecord.created_at >= cutoff,
        )
        .group_by(func.date_trunc("day", UsageRecord.created_at))
        .order_by(func.date_trunc("day", UsageRecord.created_at))
    )
    daily_breakdown = [
        {
            "date": str(r.day.date()) if hasattr(r.day, "date") else str(r.day),
            "requests": r.requests,
            "tokens": r.tokens,
        }
        for r in daily_result.all()
    ]

    return {
        "total_requests": total_requests,
        "total_tokens": total_tokens,
        "total_cost": total_cost,
        "daily_breakdown": daily_breakdown,
    }


async def check_quota(db: AsyncSession, user_id: uuid.UUID) -> bool:
    """Check whether the user is within their plan's daily quota.

    Returns ``True`` if the user can still make requests.
    """
    # Determine plan
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status.in_(["active", "trialing"]),
        )
    )
    subscription = result.scalar_one_or_none()
    plan_name = subscription.plan_name if subscription else "free"
    quota = settings.PLAN_QUOTAS.get(plan_name, settings.PLAN_QUOTAS["free"])

    # Count today's usage
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    result = await db.execute(
        select(func.count(UsageRecord.id)).where(
            UsageRecord.user_id == user_id,
            UsageRecord.created_at >= today_start,
        )
    )
    count = result.scalar() or 0

    return count < quota


async def get_system_usage_stats(db: AsyncSession) -> dict:
    """Return system-wide usage stats for admin dashboards."""
    # Total requests and tokens
    totals_result = await db.execute(
        select(
            func.count(UsageRecord.id).label("total_requests"),
            func.coalesce(func.sum(UsageRecord.tokens_used), 0).label("total_tokens"),
            func.coalesce(func.sum(UsageRecord.cost), 0.0).label("total_cost"),
        )
    )
    row = totals_result.one()

    # Total unique users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0

    # Active today
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    active_result = await db.execute(
        select(func.count(func.distinct(UsageRecord.user_id))).where(UsageRecord.created_at >= today_start)
    )
    active_today = active_result.scalar() or 0

    return {
        "total_requests": row.total_requests,
        "total_tokens": row.total_tokens,
        "total_cost": float(row.total_cost),
        "total_users": total_users,
        "active_today": active_today,
    }
