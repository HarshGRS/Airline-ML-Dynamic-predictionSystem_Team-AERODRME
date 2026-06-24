from fastapi import APIRouter, Depends

from app.schemas.predict import PredictRequest, PredictResponse
from app.services.prediction import PredictionService, get_prediction_service

router = APIRouter(tags=["prediction"])


@router.post("/predict", response_model=PredictResponse)
def predict_price(
    request: PredictRequest,
    service: PredictionService = Depends(get_prediction_service),
) -> PredictResponse:
    return service.predict(request)
