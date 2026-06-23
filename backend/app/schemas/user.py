import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    auth_provider: str = "local"
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    avatar_url: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class DashboardResponse(BaseModel):
    total_conversations: int = 0
    total_messages: int = 0
    total_api_calls: int = 0
    tokens_used: int = 0
    current_plan: str = "free"
    usage_percentage: float = 0.0
