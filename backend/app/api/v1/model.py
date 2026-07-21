from fastapi import APIRouter, Depends, Request

from app.core.rate_limit import limiter
from app.services.prediction import PredictionService, get_prediction_service

router = APIRouter(tags=["model"])


@router.get("/model/info")
@limiter.limit("60/minute")
def model_info(
    request: Request, service: PredictionService = Depends(get_prediction_service)
) -> dict:
    """Real model metadata — version, held-out metrics, and feature
    importances from training. Powers the UI's "Price Factors" panel
    with actual numbers instead of invented ones."""
    meta = service.metadata
    return {
        "model_version": meta["model_version"],
        "trained_at": meta["trained_at"],
        "dataset": meta["dataset"],
        "metrics": meta["metrics"],
        "feature_importance": meta["feature_importance"],
    }
