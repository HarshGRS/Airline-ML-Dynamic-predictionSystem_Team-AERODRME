import json
from pathlib import Path

import pandas as pd
from xgboost import XGBRegressor

from app.ml.features import FEATURE_COLUMNS, FeaturePipeline
from app.schemas.predict import PredictRequest, PredictResponse

ARTIFACTS_DIR = Path(__file__).resolve().parents[1] / "ml" / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.json"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

OOD_ZSCORE_THRESHOLD = 3.0


class PredictionService:
    """Loads the trained model + encoder once and serves predictions.

    Reuses app.ml.features.FeaturePipeline so request-time encoding is
    identical to training-time encoding (no training/serving skew).
    """

    def __init__(self):
        if not MODEL_PATH.exists() or not METADATA_PATH.exists():
            raise FileNotFoundError(
                "Model artifacts not found. Run `python -m app.ml.train` from backend/ first."
            )
        self.model = XGBRegressor()
        self.model.load_model(MODEL_PATH)
        self.pipeline = FeaturePipeline.load()
        self.metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        self.mae = self.metadata["metrics"]["mae"]
        self.numeric_stats = self.metadata["numeric_feature_stats"]

    def _is_out_of_distribution(self, duration: float, days_left: int) -> bool:
        for value, key in [(duration, "duration"), (days_left, "days_left")]:
            stats = self.numeric_stats[key]
            std = stats["std"] or 1.0
            zscore = abs(value - stats["mean"]) / std
            if zscore > OOD_ZSCORE_THRESHOLD:
                return True
        return False

    def predict(self, request: PredictRequest) -> PredictResponse:
        row = {
            "airline": request.airline.value,
            "source_city": request.source_city.value,
            "departure_time": request.departure_time.value,
            "stops": request.stops.value,
            "arrival_time": request.arrival_time.value,
            "destination_city": request.destination_city.value,
            "class": request.flight_class.value,
            "duration": request.duration,
            "days_left": request.days_left,
        }
        df = pd.DataFrame([row])[FEATURE_COLUMNS]
        encoded = self.pipeline.transform(df)
        predicted_price = float(self.model.predict(encoded)[0])

        is_ood = self._is_out_of_distribution(request.duration, request.days_left)
        margin = self.mae * (2.0 if is_ood else 1.0)

        return PredictResponse(
            predicted_price=round(predicted_price, 2),
            confidence_low=round(max(predicted_price - margin, 0), 2),
            confidence_high=round(predicted_price + margin, 2),
            model_version=self.metadata["model_version"],
            out_of_distribution=is_ood,
        )

    def predict_batch(self, requests: list[PredictRequest]) -> list[PredictResponse]:
        if not requests:
            return []
        rows = [
            {
                "airline": req.airline.value,
                "source_city": req.source_city.value,
                "departure_time": req.departure_time.value,
                "stops": req.stops.value,
                "arrival_time": req.arrival_time.value,
                "destination_city": req.destination_city.value,
                "class": req.flight_class.value,
                "duration": req.duration,
                "days_left": req.days_left,
            }
            for req in requests
        ]
        df = pd.DataFrame(rows)[FEATURE_COLUMNS]
        encoded = self.pipeline.transform(df)
        predicted_prices = self.model.predict(encoded)

        responses = []
        for req, price in zip(requests, predicted_prices):
            price_float = float(price)
            is_ood = self._is_out_of_distribution(req.duration, req.days_left)
            margin = self.mae * (2.0 if is_ood else 1.0)
            responses.append(
                PredictResponse(
                    predicted_price=round(price_float, 2),
                    confidence_low=round(max(price_float - margin, 0), 2),
                    confidence_high=round(price_float + margin, 2),
                    model_version=self.metadata["model_version"],
                    out_of_distribution=is_ood,
                )
            )
        return responses


_service: PredictionService | None = None


def get_prediction_service() -> PredictionService:
    global _service
    if _service is None:
        _service = PredictionService()
    return _service
