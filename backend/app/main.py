"""
AI SaaS Starter Kit — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    # Startup
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI SaaS Starter Kit API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET.get_secret_value() if settings.SESSION_SECRET else settings.SECRET_KEY.get_secret_value(),
)

# ── Routes ─────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── Health Checks ──────────────────────────────────────────
@app.get("/health", tags=["health"])
async def health_check():
    """Liveness probe — is the process running?"""
    return {"status": "healthy"}


@app.get("/health/ready", tags=["health"])
async def health_ready():
    """Readiness probe — can we serve traffic?"""
    checks = {}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"

    all_healthy = all(v == "healthy" for v in checks.values())
    if not all_healthy:
        return JSONResponse(status_code=503, content={"status": "not ready", "checks": checks})

    return {"status": "ready", "checks": checks}


# ── Global Exception Handler ──────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
