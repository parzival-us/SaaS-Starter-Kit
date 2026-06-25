"""
API key routes: create, list, revoke, and rotate API keys.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.core.security import generate_api_key
from app.database import get_db
from app.models.api_key import APIKey
from app.schemas.api_key import (
    APIKeyCreate,
    APIKeyCreateResponse,
    APIKeyListResponse,
    APIKeyResponse,
)

router = APIRouter()


@router.post(
    "/",
    response_model=APIKeyCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an API key",
)
async def create_api_key(
    body: APIKeyCreate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a new API key. The raw key is returned only once."""
    raw_key, hashed_key = generate_api_key()

    api_key = APIKey(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=body.name,
        key_prefix=raw_key[:8],
        hashed_key=hashed_key,
        is_active=True,
    )
    db.add(api_key)
    await db.flush()

    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key=raw_key,
        key_prefix=api_key.key_prefix,
        created_at=api_key.created_at,
    )


@router.get(
    "/",
    response_model=APIKeyListResponse,
    summary="List API keys",
)
async def list_api_keys(
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List all API keys for the current user."""
    result = await db.execute(
        select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()

    return APIKeyListResponse(
        api_keys=[APIKeyResponse.model_validate(k) for k in keys],
        total=len(keys),
    )


@router.delete(
    "/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke an API key",
)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Revoke (deactivate) an API key."""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    if api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to revoke this API key",
        )

    api_key.is_active = False
    await db.flush()


@router.post(
    "/{key_id}/rotate",
    response_model=APIKeyCreateResponse,
    summary="Rotate an API key",
)
async def rotate_api_key(
    key_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate the old key and generate a new one with the same name."""
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    old_key = result.scalar_one_or_none()

    if not old_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found",
        )
    if old_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to rotate this API key",
        )

    # Deactivate old key
    old_key.is_active = False
    await db.flush()

    # Generate new key
    raw_key, hashed_key = generate_api_key()
    new_key = APIKey(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=old_key.name,
        key_prefix=raw_key[:8],
        hashed_key=hashed_key,
        is_active=True,
    )
    db.add(new_key)
    await db.flush()

    return APIKeyCreateResponse(
        id=new_key.id,
        name=new_key.name,
        key=raw_key,
        key_prefix=new_key.key_prefix,
        created_at=new_key.created_at,
    )
