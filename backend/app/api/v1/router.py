"""
Aggregate all v1 API routers.
"""

from fastapi import APIRouter

from app.api.v1 import admin, api_keys, auth, chat, subscriptions, templates, users

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(templates.router, prefix="/templates", tags=["Templates"])
api_router.include_router(
    subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"]
)
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["API Keys"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
