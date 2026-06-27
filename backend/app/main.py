import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import auth, dashboard, health, model, predict, saved_searches, watchlists, alerts
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.rate_limit import limiter

configure_logging()
logger = logging.getLogger("app")

app = FastAPI(title=settings.app_name, version=settings.model_version)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(dashboard.router, prefix=settings.api_v1_prefix)
app.include_router(predict.router, prefix=settings.api_v1_prefix)
app.include_router(model.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(watchlists.router, prefix=settings.api_v1_prefix)
app.include_router(saved_searches.router, prefix=settings.api_v1_prefix)
app.include_router(alerts.router, prefix=settings.api_v1_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Never leak stack traces to the client (V2 blueprint security plan).
    logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
