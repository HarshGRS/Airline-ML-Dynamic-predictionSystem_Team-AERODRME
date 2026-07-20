from fastapi import APIRouter, Depends

from app.services.prediction import PredictionService, get_prediction_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check(service: PredictionService = Depends(get_prediction_service)) -> dict:
    """Liveness/readiness probe. Also exercises the model so a corrupt
    artifact fails the health check instead of failing silently on the
    first real user request (see V2 blueprint Part 14, failure-point fix)."""
    return {
        "status": "ok",
        "model_version": service.metadata["model_version"],
        "model_trained_at": service.metadata["trained_at"],
    }
