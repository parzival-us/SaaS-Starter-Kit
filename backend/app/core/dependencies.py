"""
FastAPI dependencies for authentication, authorization, and quota enforcement.
"""

from __future__ import annotations

import hashlib
import uuid
from datetime import date, datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import decode_token
from app.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode the JWT and return the corresponding ``User`` row."""
    from app.models.user import User  # deferred to avoid circular imports

    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exc
    try:
        payload = decode_token(token, settings.SECRET_KEY.get_secret_value())
        if payload.get("type") != "access":
            raise credentials_exc
        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exc

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exc
    return user


async def get_current_active_user(
    current_user=Depends(get_current_user),
):
    """Ensure the authenticated user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return current_user


async def get_admin_user(
    current_user=Depends(get_current_active_user),
):
    """Ensure the authenticated user is an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user


async def verify_api_key_dep(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    """Validate the ``X-API-Key`` header and return the owning ``User``."""
    from app.models.api_key import APIKey
    from app.models.user import User

    hashed = hashlib.sha256(x_api_key.encode()).hexdigest()
    result = await db.execute(
        select(APIKey).where(APIKey.hashed_key == hashed, APIKey.is_active.is_(True))
    )
    api_key = result.scalar_one_or_none()
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
        )
    # Update last_used_at
    api_key.last_used_at = datetime.now(timezone.utc)
    await db.flush()

    result = await db.execute(select(User).where(User.id == api_key.user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User associated with this API key is inactive",
        )
    return user


async def check_usage_quota(
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify the user hasn't exceeded their plan's daily quota."""
    from app.models.subscription import Subscription
    from app.models.usage import UsageRecord

    # Determine plan
    result = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
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
            UsageRecord.user_id == current_user.id,
            UsageRecord.created_at >= today_start,
        )
    )
    count = result.scalar() or 0

    if count >= quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily quota of {quota} requests exceeded for '{plan_name}' plan",
        )
    return current_user
