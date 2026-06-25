"""
Authentication routes: register, login, refresh, Google OAuth.
"""

from __future__ import annotations

import logging
from urllib.parse import urlencode

from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.auth import RefreshRequest, RegisterRequest, TokenResponse
from app.services import auth as auth_service

logger = logging.getLogger("app.api.auth")

router = APIRouter()

# ── Google OAuth setup ───────────────────────────────────────
oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    schema: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with email and password."""
    user = await auth_service.register_user(db, schema)
    return auth_service.create_tokens(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with email (username field) and password.

    Uses ``OAuth2PasswordRequestForm`` for Swagger UI compatibility.
    """
    user = await auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )
    return auth_service.create_tokens(user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Exchange a valid refresh token for a new token pair."""
    return await auth_service.refresh_tokens(db, body.refresh_token)


@router.get("/google/login", summary="Redirect to Google OAuth")
async def google_login(request: Request):
    """Redirect the user to Google's OAuth consent screen."""
    # Build redirect URI from FRONTEND_URL to avoid Docker/proxy mismatches
    base_url = settings.FRONTEND_URL.rstrip("/")
    redirect_uri = f"{base_url}/api/v1/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", summary="Google OAuth callback")
async def google_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle the callback from Google OAuth.

    Finds or creates the user, generates tokens, and redirects to the
    frontend with tokens as query parameters.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        logger.error("Google OAuth token exchange failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to authenticate with Google",
        )

    userinfo = token.get("userinfo")
    if not userinfo:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to get user info from Google",
        )

    email = userinfo.get("email")
    name = userinfo.get("name")
    google_id = userinfo.get("sub")
    picture = userinfo.get("picture")

    if not email or not google_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google did not provide required user information",
        )

    user, is_new = await auth_service.find_or_create_oauth_user(
        db, email=email, name=name, google_id=google_id, avatar_url=picture
    )

    tokens = auth_service.create_tokens(user)

    # Redirect to frontend with tokens as query params
    params = urlencode(
        {
            "access_token": tokens.access_token,
            "refresh_token": tokens.refresh_token,
            "is_new_user": str(is_new).lower(),
        }
    )
    redirect_url = f"{settings.FRONTEND_URL}/auth/callback?{params}"
    return RedirectResponse(url=redirect_url)
