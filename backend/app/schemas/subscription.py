import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class PlanFeature(BaseModel):
    name: str
    included: bool = True
    limit: Optional[str] = None


class PlanResponse(BaseModel):
    name: str
    display_name: str
    price_monthly: float
    price_id: Optional[str] = None
    features: List[PlanFeature] = []
    is_popular: bool = False


class SubscriptionResponse(BaseModel):
    id: uuid.UUID
    plan_name: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class CheckoutRequest(BaseModel):
    price_id: str
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str
