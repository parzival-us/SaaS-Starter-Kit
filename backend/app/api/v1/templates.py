"""
Prompt template routes: CRUD operations for reusable AI prompts.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.prompt_template import PromptTemplate
from app.schemas.template import (
    TemplateCreate,
    TemplateListResponse,
    TemplateResponse,
    TemplateUpdate,
)

router = APIRouter()


@router.get(
    "/",
    response_model=TemplateListResponse,
    summary="List templates",
)
async def list_templates(
    category: str | None = Query(None, description="Filter by category"),
    search: str | None = Query(None, description="Search by title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List public templates and the current user's own templates."""
    base_filter = or_(
        PromptTemplate.is_public.is_(True),
        PromptTemplate.user_id == current_user.id,
    )

    query = select(PromptTemplate).where(base_filter)
    count_query = select(func.count(PromptTemplate.id)).where(base_filter)

    if category:
        query = query.where(PromptTemplate.category == category)
        count_query = count_query.where(PromptTemplate.category == category)

    if search:
        search_filter = PromptTemplate.title.ilike(f"%{search}%")
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Fetch templates
    query = query.order_by(PromptTemplate.usage_count.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    templates = result.scalars().all()

    return TemplateListResponse(
        templates=[TemplateResponse.model_validate(t) for t in templates],
        total=total,
    )


@router.post(
    "/",
    response_model=TemplateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a template",
)
async def create_template(
    body: TemplateCreate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new prompt template for the current user."""
    template = PromptTemplate(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        content=body.content,
        category=body.category,
        is_public=body.is_public,
    )
    db.add(template)
    await db.flush()
    return TemplateResponse.model_validate(template)


@router.get(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Get a template",
)
async def get_template(
    template_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a template by ID. Must be public or owned by the current user."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )

    if not template.is_public and template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this template",
        )

    return TemplateResponse.model_validate(template)


@router.patch(
    "/{template_id}",
    response_model=TemplateResponse,
    summary="Update a template",
)
async def update_template(
    template_id: uuid.UUID,
    body: TemplateUpdate,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a template. Only the owner can update it."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    if template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this template",
        )

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    await db.flush()

    return TemplateResponse.model_validate(template)


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a template",
)
async def delete_template(
    template_id: uuid.UUID,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a template. Only the owner can delete it."""
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found",
        )
    if template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this template",
        )

    await db.delete(template)
    await db.flush()
