import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TemplateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    content: str = Field(..., min_length=1)
    category: str = "general"
    is_public: bool = False


class TemplateUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_public: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    content: str
    category: str
    is_public: bool
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    templates: List[TemplateResponse]
    total: int
