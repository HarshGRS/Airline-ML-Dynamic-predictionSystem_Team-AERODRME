FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# app/ml/artifacts/ ships the already-trained model (model.json, encoder.joblib,
# model_metadata.json) committed to the repo — no retraining needed at build time.
COPY app/ app/
COPY alembic/ alembic/
COPY alembic.ini .

EXPOSE 8000
CMD ["sh", "-c", "python -m alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
