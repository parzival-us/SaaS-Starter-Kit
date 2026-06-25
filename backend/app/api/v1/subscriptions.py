"""
Subscription routes: plans, Stripe checkout, billing portal, and webhooks.
"""

from __future__ import annotations

import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.schemas.subscription import (
    CheckoutRequest,
    CheckoutResponse,
    PlanResponse,
    PortalResponse,
)
from app.services import stripe_service

logger = logging.getLogger("app.api.subscriptions")

router = APIRouter()


@router.get(
    "/plans",
    response_model=list[PlanResponse],
    summary="List available plans",
)
async def get_plans():
    """Return all available subscription plans with features."""
    return stripe_service.get_plans()


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    summary="Create checkout session",
)
async def create_checkout(
    body: CheckoutRequest,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for the given price."""
    # Ensure user has a Stripe customer ID
    if not current_user.stripe_customer_id:
        customer_id = stripe_service.create_customer(
            email=current_user.email,
            name=current_user.full_name,
        )
        current_user.stripe_customer_id = customer_id
        await db.flush()

    try:
        checkout_url = stripe_service.create_checkout_session(
            customer_id=current_user.stripe_customer_id,
            price_id=body.price_id,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
    except stripe.StripeError as exc:
        logger.error("Stripe checkout error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {exc.user_message or str(exc)}",
        )

    return CheckoutResponse(checkout_url=checkout_url)


@router.get(
    "/portal",
    response_model=PortalResponse,
    summary="Create billing portal session",
)
async def create_portal(
    return_url: str | None = None,
    current_user=Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Billing Portal session."""
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active billing account found",
        )

    url = return_url or f"{settings.FRONTEND_URL}/dashboard/billing"

    try:
        portal_url = stripe_service.create_portal_session(
            customer_id=current_user.stripe_customer_id,
            return_url=url,
        )
    except stripe.StripeError as exc:
        logger.error("Stripe portal error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {exc.user_message or str(exc)}",
        )

    return PortalResponse(portal_url=portal_url)


@router.post("/webhook", summary="Stripe webhook endpoint")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Receive and process Stripe webhook events.

    Verifies the event signature and dispatches to the appropriate handler.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe signature",
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload",
        )

    event_type = event["type"]
    event_data = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await stripe_service.handle_checkout_completed(db, event_data)
    elif event_type == "customer.subscription.updated":
        await stripe_service.handle_subscription_updated(db, event_data)
    elif event_type == "customer.subscription.deleted":
        await stripe_service.handle_subscription_deleted(db, event_data)
    elif event_type == "invoice.payment_failed":
        logger.warning("Payment failed for customer %s", event_data.get("customer"))
    else:
        logger.info("Unhandled Stripe event type: %s", event_type)

    return {"status": "ok"}
