import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.init_db import init_database
from app.scheduler import start_scheduler, stop_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events."""
    # ── Startup ──────────────────────────────────────────────────────
    init_database()
    start_scheduler()
    logger.info("🚀 MedBridge API is ready.")
    yield
    # ── Shutdown ─────────────────────────────────────────────────────
    stop_scheduler()
    logger.info("👋 MedBridge API shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (uploaded documents) ────────────────────────────────────────
import os
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Register routers ────────────────────────────────────────────────────────
from app.routers import auth, clinics, schedules, appointments, documents, sharing, reminders, dashboard, doctors, ai

app.include_router(auth.router)
app.include_router(clinics.router)
app.include_router(schedules.router)
app.include_router(appointments.router)
app.include_router(documents.router)
app.include_router(sharing.router)
app.include_router(reminders.router)
app.include_router(dashboard.router)
app.include_router(doctors.router)
app.include_router(ai.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", status_code=200)
async def health_check():
    return {
        "status": "healthy",
        "message": "MedBridge API is running",
        "env": settings.ENVIRONMENT,
    }
