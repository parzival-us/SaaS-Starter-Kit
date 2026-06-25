"""
Authentication service: registration, login, OAuth, and token management.
"""

from __future__ import annotations

import uuid

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse


async def register_user(db: AsyncSession, schema: RegisterRequest) -> User:
    """Register a new user with email/password, creating a free subscription."""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == schema.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Create user
    user = User(
        id=uuid.uuid4(),
        email=schema.email,
        hashed_password=get_password_hash(schema.password),
        full_name=schema.full_name,
        auth_provider="local",
    )
    db.add(user)
    await db.flush()

    # Create free subscription
    subscription = Subscription(
        id=uuid.uuid4(),
        user_id=user.id,
        plan_name="free",
        status="active",
    )
    db.add(subscription)
    await db.flush()

    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Verify email/password credentials. Returns the user or None."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        return None
    if user.hashed_password is None:
        # OAuth-only user, cannot authenticate with password
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def find_or_create_oauth_user(
    db: AsyncSession,
    email: str,
    name: str | None,
    google_id: str,
    avatar_url: str | None = None,
) -> tuple[User, bool]:
    """Find an existing user by google_id or email, or create a new one.

    Returns ``(user, is_new_user)``."""
    # Try finding by google_id first
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()
    if user:
        return user, False

    # Try finding by email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        # Link Google account to existing user
        user.google_id = google_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if name and not user.full_name:
            user.full_name = name
        await db.flush()
        return user, False

    # Create new user
    user = User(
        id=uuid.uuid4(),
        email=email,
        full_name=name,
        avatar_url=avatar_url,
        auth_provider="google",
        google_id=google_id,
    )
    db.add(user)
    await db.flush()

    # Create free subscription
    subscription = Subscription(
        id=uuid.uuid4(),
        user_id=user.id,
        plan_name="free",
        status="active",
    )
    db.add(subscription)
    await db.flush()

    return user, True


def create_tokens(user: User) -> TokenResponse:
    """Generate access and refresh tokens for the given user."""
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


async def refresh_tokens(db: AsyncSession, refresh_token_str: str) -> TokenResponse:
    """Decode a refresh token and issue a new token pair."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = decode_token(refresh_token_str, settings.REFRESH_SECRET_KEY.get_secret_value())
        if payload.get("type") != "refresh":
            raise credentials_exc
        user_id_str = payload.get("sub")
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
    if user is None or not user.is_active:
        raise credentials_exc

    return create_tokens(user)
