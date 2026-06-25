import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AdminStatsResponse(BaseModel):
    total_users: int = 0
    active_users: int = 0
    total_conversations: int = 0
    total_messages: int = 0
    total_api_keys: int = 0
    active_subscriptions: int = 0
    revenue_this_month: float = 0.0


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    auth_provider: str
    is_active: bool
    is_admin: bool
    plan_name: str = "free"
    created_at: datetime
    model_config = {"from_attributes": True}


class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class AdminUserListResponse(BaseModel):
    users: List[AdminUserResponse]
    total: int
    page: int
    page_size: int
