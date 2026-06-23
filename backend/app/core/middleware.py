"""
ASGI middleware: rate-limiting (Redis-backed), usage tracking, and request logging.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import date

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.config import settings

logger = logging.getLogger("app.middleware")


# ── Helpers ──────────────────────────────────────────────────
def _get_redis():
    """Return a lazy Redis connection (imported at call-time so the module
    can be imported even when Redis isn't reachable)."""
    try:
        import redis as _redis

        return _redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    except Exception:
        return None


def _client_key(request: Request) -> str:
    """Best-effort identifier: authenticated user-id, then IP."""
    user = getattr(request.state, "user_id", None)
    if user:
        return f"user:{user}"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    client = request.client
    return f"ip:{client.host}" if client else "ip:unknown"


# ── Rate-limiting middleware ─────────────────────────────────
class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window rate limiter backed by Redis.
    Falls back to allowing all requests when Redis is unavailable.
    """

    def __init__(self, app, per_minute: int | None = None):
        super().__init__(app)
        self.per_minute = per_minute or settings.RATE_LIMIT_PER_MINUTE

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate-limiting for health endpoints
        if request.url.path.startswith("/health"):
            return await call_next(request)

        r = _get_redis()
        if r is None:
            return await call_next(request)

        key = f"rl:{_client_key(request)}"
        try:
            pipe = r.pipeline()
            now = time.time()
            window_start = now - 60
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(now): now})
            pipe.zcard(key)
            pipe.expire(key, 120)
            results = pipe.execute()
            count = results[2]
        except Exception:
            return await call_next(request)

        if count > self.per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={"Retry-After": "60"},
            )
        return await call_next(request)


# ── Usage-tracking middleware ────────────────────────────────
class UsageTrackingMiddleware(BaseHTTPMiddleware):
    """
    Increment a per-user/day counter in Redis for every API request.
    This is a lightweight counter; detailed records are written by the
    usage service after AI calls.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        response = await call_next(request)

        # Only track authenticated API requests
        user_id = getattr(request.state, "user_id", None)
        if user_id is None:
            return response

        r = _get_redis()
        if r is None:
            return response

        today = date.today().isoformat()
        key = f"usage:{user_id}:{today}"
        try:
            r.incr(key)
            r.expire(key, 60 * 60 * 48)  # keep for 48h
        except Exception:
            pass

        return response


# ── Request-logging middleware ───────────────────────────────
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log method, path, status code, and duration for every request."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        response: Response | None = None
        try:
            response = await call_next(request)
            return response
        finally:
            elapsed_ms = (time.perf_counter() - start) * 1000
            status_code = response.status_code if response else 500
            logger.info(
                "%s %s → %s (%.1fms)",
                request.method,
                request.url.path,
                status_code,
                elapsed_ms,
            )
