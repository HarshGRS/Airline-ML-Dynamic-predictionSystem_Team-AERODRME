from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.rate_limit import limiter
from app.schemas.predict import PredictRequest, PredictResponse
from app.services.prediction import PredictionService, get_prediction_service

router = APIRouter(tags=["prediction"])

MAX_BATCH_SIZE = 60  # frontend's largest real batch (trend chart) is 12 points


@router.post("/predict", response_model=PredictResponse)
@limiter.limit("30/minute")
def predict_price(
    request: Request,
    payload: PredictRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictResponse:
    return service.predict(payload)

@router.post("/predict/batch", response_model=list[PredictResponse])
@limiter.limit("10/minute")
def predict_batch(
    request: Request,
    payload: list[PredictRequest],
    service: PredictionService = Depends(get_prediction_service),
) -> list[PredictResponse]:
    if len(payload) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Batch size exceeds limit of {MAX_BATCH_SIZE}",
        )
    return service.predict_batch(payload)
