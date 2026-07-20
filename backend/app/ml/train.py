"""Train the flight price prediction model (V2 blueprint, Phase 1).

Data: Kaggle "Flight Price Prediction" dataset (Clean_Dataset.csv),
300,153 real domestic India flight fares.

Run from backend/:
    venv\\Scripts\\python.exe -m app.ml.train
"""
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from app.ml.features import FeaturePipeline, TARGET_COLUMN, load_raw_dataset

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_PATH = BACKEND_DIR / "data" / "raw" / "Air Line dataset" / "Clean_Dataset.csv"
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.json"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"
MODEL_CARD_PATH = BACKEND_DIR.parent / "docs" / "model_card.md"

MODEL_VERSION = "v1.0.0"
RANDOM_STATE = 42


def main() -> None:
    print(f"Loading dataset from {DATA_PATH}")
    df = load_raw_dataset(DATA_PATH)
    print(f"Loaded {len(df):,} rows")

    X_raw = df.drop(columns=[TARGET_COLUMN, "flight"])
    y = df[TARGET_COLUMN].astype(float)

    pipeline = FeaturePipeline()
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=RANDOM_STATE
    )

    X_train = pipeline.fit_transform(X_train_raw)
    X_test = pipeline.transform(X_test_raw)

    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    print("Training XGBoost...")
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    mape = mean_absolute_percentage_error(y_test, preds)
    rmse = float(np.sqrt(np.mean((y_test.values - preds) ** 2)))
    r2 = r2_score(y_test, preds)

    print(f"MAE:  {mae:,.2f}")
    print(f"RMSE: {rmse:,.2f}")
    print(f"MAPE: {mape * 100:.2f}%")
    print(f"R^2:  {r2:.4f}")

    importances = dict(
        sorted(
            zip(X_train.columns, model.feature_importances_.tolist()),
            key=lambda kv: kv[1],
            reverse=True,
        )
    )

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model.save_model(MODEL_PATH)
    pipeline.save()

    metadata = {
        "model_version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": "Kaggle Flight Price Prediction (Clean_Dataset.csv)",
        "n_rows": len(df),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "metrics": {"mae": mae, "rmse": rmse, "mape_pct": mape * 100, "r2": r2},
        "feature_importance": importances,
        "feature_columns": list(X_train.columns),
        "price_range": {"min": float(y.min()), "max": float(y.max()), "mean": float(y.mean())},
        "numeric_feature_stats": {
            col: {
                "mean": float(X_raw[col].mean()),
                "std": float(X_raw[col].std()),
                "min": float(X_raw[col].min()),
                "max": float(X_raw[col].max()),
            }
            for col in ["duration", "days_left"]
        },
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved model -> {MODEL_PATH}")
    print(f"Saved metadata -> {METADATA_PATH}")

    write_model_card(metadata)
    print(f"Saved model card -> {MODEL_CARD_PATH}")


def write_model_card(metadata: dict) -> None:
    m = metadata["metrics"]
    top_features = list(metadata["feature_importance"].items())[:5]
    lines = [
        "# Model Card — Flight Price Prediction",
        "",
        f"- **Model version:** {metadata['model_version']}",
        f"- **Trained at (UTC):** {metadata['trained_at']}",
        f"- **Algorithm:** XGBoost Regressor (300 trees, max_depth=6, lr=0.08)",
        f"- **Dataset:** {metadata['dataset']}",
        f"- **Rows:** {metadata['n_rows']:,} total ({metadata['n_train']:,} train / {metadata['n_test']:,} test, 80/20 split, random_state=42)",
        "",
        "## Held-out test set metrics",
        "",
        f"| Metric | Value |",
        f"|---|---|",
        f"| MAE | ₹{m['mae']:,.0f} |",
        f"| RMSE | ₹{m['rmse']:,.0f} |",
        f"| MAPE | {m['mape_pct']:.2f}% |",
        f"| R² | {m['r2']:.4f} |",
        "",
        "## Top 5 most important features",
        "",
    ]
    for name, score in top_features:
        lines.append(f"- `{name}`: {score:.4f}")
    lines += [
        "",
        "## Price range in training data",
        "",
        f"- Min: ₹{metadata['price_range']['min']:,.0f}",
        f"- Max: ₹{metadata['price_range']['max']:,.0f}",
        f"- Mean: ₹{metadata['price_range']['mean']:,.0f}",
        "",
        "## Known limitations",
        "",
        "- Dataset is a single historical snapshot of Indian domestic routes (Feb 2022), not a live feed.",
        "- No external factors (fuel price, holidays, demand shocks) are modeled.",
        "- Out-of-distribution inputs (unseen airline/route combinations) are not flagged yet — see V2 blueprint Part 14 for the planned confidence-guard fix.",
        "",
    ]
    MODEL_CARD_PATH.parent.mkdir(parents=True, exist_ok=True)
    MODEL_CARD_PATH.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
