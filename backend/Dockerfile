FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir \
    fastapi uvicorn[standard] pydantic-settings httpx \
    pandas numpy scikit-learn xgboost joblib

COPY app/ app/
COPY data/raw/Air Line dataset/Clean_Dataset.csv data/raw/Air Line dataset/Clean_Dataset.csv

RUN python -m app.ml.train

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
