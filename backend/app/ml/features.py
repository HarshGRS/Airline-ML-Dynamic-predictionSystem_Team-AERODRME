"""Shared feature engineering for the flight price model.

Imported by both train.py (training time) and the FastAPI /predict endpoint
(serving time) so the exact same encoding logic runs in both places —
this is the fix for training/serving skew called out in the V2 blueprint.
"""
from pathlib import Path

import joblib
import pandas as pd
from sklearn.preprocessing import OrdinalEncoder

CATEGORICAL_COLUMNS = [
    "airline",
    "source_city",
    "departure_time",
    "stops",
    "arrival_time",
    "destination_city",
    "class",
]
NUMERIC_COLUMNS = ["duration", "days_left"]
FEATURE_COLUMNS = CATEGORICAL_COLUMNS + NUMERIC_COLUMNS
TARGET_COLUMN = "price"

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
ENCODER_PATH = ARTIFACTS_DIR / "encoder.joblib"


class FeaturePipeline:
    """Encodes raw flight-search fields into the numeric matrix XGBoost expects."""

    def __init__(self):
        self.encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
        self._fitted = False

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df[FEATURE_COLUMNS].copy()
        out[CATEGORICAL_COLUMNS] = self.encoder.fit_transform(out[CATEGORICAL_COLUMNS])
        self._fitted = True
        return out

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self._fitted:
            raise RuntimeError("FeaturePipeline must be fit or loaded before transform()")
        out = df[FEATURE_COLUMNS].copy()
        out[CATEGORICAL_COLUMNS] = self.encoder.transform(out[CATEGORICAL_COLUMNS])
        return out

    def save(self, path: Path = ENCODER_PATH) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.encoder, path)

    @classmethod
    def load(cls, path: Path = ENCODER_PATH) -> "FeaturePipeline":
        pipeline = cls()
        pipeline.encoder = joblib.load(path)
        pipeline._fitted = True
        return pipeline


def load_raw_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    first_col = df.columns[0]
    if first_col.startswith("Unnamed") or first_col == "":
        df = df.drop(columns=[first_col])
    return df
