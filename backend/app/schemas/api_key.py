import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, List


class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class APIKeyCreateResponse(BaseModel):
    id: uuid.UUID
    name: str
    key: str  # Raw key, shown only once
    key_prefix: str
    created_at: datetime


class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class APIKeyListResponse(BaseModel):
    api_keys: List[APIKeyResponse]
    total: int
