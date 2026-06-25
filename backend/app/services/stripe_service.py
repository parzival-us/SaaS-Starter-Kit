"""
Stripe integration service: customers, checkout, portal, and webhook handlers.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import stripe
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.subscription import PlanFeature, PlanResponse

logger = logging.getLogger("app.services.stripe")

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_customer(email: str, name: str | None = None) -> str:
    """Create a Stripe customer and return the customer ID."""
    params: dict = {"email": email}
    if name:
        params["name"] = name
    customer = stripe.Customer.create(**params)
    return customer.id


def create_checkout_session(
    customer_id: str, price_id: str, success_url: str, cancel_url: str
) -> str:
    """Create a Stripe Checkout session for a subscription and return the URL."""
    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return session.url


def create_portal_session(customer_id: str, return_url: str) -> str:
    """Create a Stripe Billing Portal session and return the URL."""
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


def _plan_from_price_id(price_id: str) -> str:
    """Map a Stripe price ID to our internal plan name."""
    if price_id == settings.STRIPE_PRICE_ID_PRO:
        return "pro"
    if price_id == settings.STRIPE_PRICE_ID_ENTERPRISE:
        return "enterprise"
    return "pro"  # default to pro for unknown price IDs


async def handle_checkout_completed(db: AsyncSession, session_data: dict) -> None:
    """Handle the checkout.session.completed event."""
    customer_id = session_data.get("customer")
    stripe_sub_id = session_data.get("subscription")

    if not customer_id or not stripe_sub_id:
        logger.warning("Checkout session missing customer or subscription")
        return

    # Find user by stripe_customer_id
    result = await db.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        logger.warning("No user found for Stripe customer %s", customer_id)
        return

    # Retrieve the subscription from Stripe to get price details
    try:
        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
        price_id = stripe_sub["items"]["data"][0]["price"]["id"]
        plan_name = _plan_from_price_id(price_id)
        period_start = datetime.fromtimestamp(
            stripe_sub["current_period_start"], tz=timezone.utc
        )
        period_end = datetime.fromtimestamp(
            stripe_sub["current_period_end"], tz=timezone.utc
        )
    except Exception:
        logger.exception("Failed to retrieve Stripe subscription details")
        plan_name = "pro"
        period_start = None
        period_end = None

    # Find existing subscription or create new one
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user.id)
    )
    subscription = result.scalar_one_or_none()

    if subscription:
        subscription.stripe_subscription_id = stripe_sub_id
        subscription.plan_name = plan_name
        subscription.status = "active"
        subscription.current_period_start = period_start
        subscription.current_period_end = period_end
    else:
        subscription = Subscription(
            user_id=user.id,
            stripe_subscription_id=stripe_sub_id,
            plan_name=plan_name,
            status="active",
            current_period_start=period_start,
            current_period_end=period_end,
        )
        db.add(subscription)

    await db.flush()
    logger.info("Subscription activated for user %s: plan=%s", user.id, plan_name)


async def handle_subscription_updated(
    db: AsyncSession, subscription_data: dict
) -> None:
    """Handle the customer.subscription.updated event."""
    stripe_sub_id = subscription_data.get("id")
    if not stripe_sub_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        logger.warning("No subscription found for Stripe sub %s", stripe_sub_id)
        return

    # Update status
    new_status = subscription_data.get("status", subscription.status)
    subscription.status = new_status

    # Update price / plan if items present
    items = subscription_data.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id", "")
        if price_id:
            subscription.plan_name = _plan_from_price_id(price_id)

    # Update period dates
    period_start = subscription_data.get("current_period_start")
    period_end = subscription_data.get("current_period_end")
    if period_start:
        subscription.current_period_start = datetime.fromtimestamp(
            period_start, tz=timezone.utc
        )
    if period_end:
        subscription.current_period_end = datetime.fromtimestamp(
            period_end, tz=timezone.utc
        )

    await db.flush()
    logger.info("Subscription %s updated: status=%s", stripe_sub_id, new_status)


async def handle_subscription_deleted(
    db: AsyncSession, subscription_data: dict
) -> None:
    """Handle the customer.subscription.deleted event."""
    stripe_sub_id = subscription_data.get("id")
    if not stripe_sub_id:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.stripe_subscription_id == stripe_sub_id)
    )
    subscription = result.scalar_one_or_none()
    if not subscription:
        logger.warning("No subscription found for Stripe sub %s", stripe_sub_id)
        return

    subscription.status = "canceled"
    subscription.plan_name = "free"
    await db.flush()
    logger.info("Subscription %s canceled", stripe_sub_id)


def get_plans() -> list[PlanResponse]:
    """Return the list of available subscription plans with features."""
    return [
        PlanResponse(
            name="free",
            display_name="Free",
            price_monthly=0.0,
            price_id=None,
            is_popular=False,
            features=[
                PlanFeature(name="AI Chat", included=True, limit="50 messages/day"),
                PlanFeature(
                    name="Prompt Templates", included=True, limit="5 templates"
                ),
                PlanFeature(name="Conversation History", included=True, limit="7 days"),
                PlanFeature(name="API Access", included=False),
                PlanFeature(name="Priority Support", included=False),
            ],
        ),
        PlanResponse(
            name="pro",
            display_name="Pro",
            price_monthly=19.99,
            price_id=settings.STRIPE_PRICE_ID_PRO or None,
            is_popular=True,
            features=[
                PlanFeature(name="AI Chat", included=True, limit="1,000 messages/day"),
                PlanFeature(name="Prompt Templates", included=True, limit="Unlimited"),
                PlanFeature(
                    name="Conversation History", included=True, limit="Unlimited"
                ),
                PlanFeature(name="API Access", included=True, limit="1,000 req/day"),
                PlanFeature(name="Priority Support", included=True),
            ],
        ),
        PlanResponse(
            name="enterprise",
            display_name="Enterprise",
            price_monthly=99.99,
            price_id=settings.STRIPE_PRICE_ID_ENTERPRISE or None,
            is_popular=False,
            features=[
                PlanFeature(name="AI Chat", included=True, limit="10,000 messages/day"),
                PlanFeature(name="Prompt Templates", included=True, limit="Unlimited"),
                PlanFeature(
                    name="Conversation History", included=True, limit="Unlimited"
                ),
                PlanFeature(name="API Access", included=True, limit="10,000 req/day"),
                PlanFeature(name="Priority Support", included=True),
                PlanFeature(name="Custom Integrations", included=True),
                PlanFeature(name="Dedicated Account Manager", included=True),
            ],
        ),
    ]
