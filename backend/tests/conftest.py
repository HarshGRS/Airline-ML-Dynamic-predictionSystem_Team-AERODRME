import os

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.core.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True, scope="session")
def _setup_test_db():
    Base.metadata.create_all(bind=engine)
    # Rate limiting is exercised in test_rate_limit.py with its own fresh
    # client; disabling it here avoids the whole suite tripping the limit
    # since TestClient requests all share one fake IP.
    app.state.limiter.enabled = False
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def valid_predict_payload() -> dict:
    return {
        "airline": "Vistara",
        "source_city": "Delhi",
        "destination_city": "Mumbai",
        "departure_time": "Morning",
        "arrival_time": "Afternoon",
        "stops": "one",
        "class": "Economy",
        "duration": 2.5,
        "days_left": 10,
    }


@pytest.fixture()
def auth_headers(client):
    def _make(email: str = "test@example.com", password: str = "supersecret123") -> dict:
        client.post("/api/v1/auth/signup", json={"email": email, "password": password})
        response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _make
