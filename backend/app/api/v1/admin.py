"""
Admin routes: system stats, user management, and usage overview.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_admin_user
from app.database import get_db
from app.models.api_key import APIKey
from app.models.chat import Conversation, Message
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserListResponse,
    AdminUserResponse,
    AdminUserUpdate,
)
from app.services import usage as usage_service

router = APIRouter()


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="System statistics",
)
async def get_stats(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Return system-wide statistics for the admin dashboard."""
    # Total users
    users_result = await db.execute(select(func.count(User.id)))
    total_users = users_result.scalar() or 0

    # Active users
    active_result = await db.execute(select(func.count(User.id)).where(User.is_active.is_(True)))
    active_users = active_result.scalar() or 0

    # Total conversations
    conv_result = await db.execute(select(func.count(Conversation.id)))
    total_conversations = conv_result.scalar() or 0

    # Total messages
    msg_result = await db.execute(select(func.count(Message.id)))
    total_messages = msg_result.scalar() or 0

    # Total API keys
    keys_result = await db.execute(select(func.count(APIKey.id)))
    total_api_keys = keys_result.scalar() or 0

    # Active subscriptions (non-free)
    subs_result = await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.status.in_(["active", "trialing"]),
            Subscription.plan_name != "free",
        )
    )
    active_subscriptions = subs_result.scalar() or 0

    # Revenue this month (estimated from active paid subscriptions)
    # This is a simplified calculation
    revenue_result = await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.status == "active",
            Subscription.plan_name == "pro",
        )
    )
    pro_count = revenue_result.scalar() or 0

    enterprise_result = await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.status == "active",
            Subscription.plan_name == "enterprise",
        )
    )
    enterprise_count = enterprise_result.scalar() or 0

    revenue_this_month = (pro_count * 19.99) + (enterprise_count * 99.99)

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_api_keys=total_api_keys,
        active_subscriptions=active_subscriptions,
        revenue_this_month=round(revenue_this_month, 2),
    )


@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="List users (paginated)",
)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Search by email or name"),
    plan: str | None = Query(None, description="Filter by plan name"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Return a paginated list of users with optional filters."""
    # Base query: left join with subscription to get plan_name
    sub_subq = (
        select(
            Subscription.user_id,
            Subscription.plan_name,
        )
        .where(Subscription.status.in_(["active", "trialing"]))
        .distinct(Subscription.user_id)
        .subquery()
    )

    query = select(
        User,
        func.coalesce(sub_subq.c.plan_name, "free").label("plan_name"),
    ).outerjoin(sub_subq, User.id == sub_subq.c.user_id)

    count_query = select(func.count(User.id))

    # Apply filters
    if search:
        search_filter = or_(
            User.email.ilike(f"%{search}%"),
            User.full_name.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    if is_active is not None:
        query = query.where(User.is_active == is_active)
        count_query = count_query.where(User.is_active == is_active)

    if plan:
        query = query.where(func.coalesce(sub_subq.c.plan_name, "free") == plan)

    # Total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(User.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)

    users = []
    for row in result.all():
        user = row[0]
        user_plan = row[1]
        users.append(
            AdminUserResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                auth_provider=user.auth_provider,
                is_active=user.is_active,
                is_admin=user.is_admin,
                plan_name=user_plan,
                created_at=user.created_at,
            )
        )

    return AdminUserListResponse(
        users=users,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Get user details",
)
async def get_user(
    user_id: uuid.UUID,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Return detailed information about a specific user."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Get subscription plan
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status.in_(["active", "trialing"]),
        )
    )
    subscription = sub_result.scalar_one_or_none()
    plan_name = subscription.plan_name if subscription else "free"

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        auth_provider=user.auth_provider,
        is_active=user.is_active,
        is_admin=user.is_admin,
        plan_name=plan_name,
        created_at=user.created_at,
    )


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Update user status",
)
async def update_user(
    user_id: uuid.UUID,
    body: AdminUserUpdate,
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle a user's active or admin status."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.flush()

    # Get subscription plan
    sub_result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user.id,
            Subscription.status.in_(["active", "trialing"]),
        )
    )
    subscription = sub_result.scalar_one_or_none()
    plan_name = subscription.plan_name if subscription else "free"

    return AdminUserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        auth_provider=user.auth_provider,
        is_active=user.is_active,
        is_admin=user.is_admin,
        plan_name=plan_name,
        created_at=user.created_at,
    )


@router.get("/usage", summary="System-wide usage stats")
async def get_usage(
    _admin=Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """Return system-wide usage statistics."""
    return await usage_service.get_system_usage_stats(db)
