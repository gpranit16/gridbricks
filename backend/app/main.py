"""
FastAPI Application Entry Point
UK Wind Generation Forecast and Accuracy Analytics Dashboard API
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.api.routes import router as api_router
from backend.app.db.mongo import mongo_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("wind_forecast_api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB connection
    logger.info("Starting up UK Wind Forecast Analytics API...")
    mongo_service.connect()
    yield
    # Shutdown
    logger.info("Shutting down API...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Wholesale electricity procurement analytics for UK day-ahead wind generation forecasts (Elexon WINDFOR vs FUELHH).",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
def root_redirect():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": "/api/health",
        "description": "API serving Elexon day-ahead wind forecast accuracy analytics for January 2026 purchasing decisions."
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing request %s: %s", request.url, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred while processing analytics request.", "error": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
