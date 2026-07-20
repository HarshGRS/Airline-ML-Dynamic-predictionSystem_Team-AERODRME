import pytest

from app.main import app


@pytest.fixture()
def rate_limiting_enabled():
    app.state.limiter.enabled = True
    yield
    app.state.limiter.enabled = False


def test_signup_is_rate_limited(client, rate_limiting_enabled):
    payload = {"email": "ratelimit@example.com", "password": "supersecret123"}
    responses = [client.post("/api/v1/auth/signup", json=payload) for _ in range(6)]
    statuses = [r.status_code for r in responses]
    assert 429 in statuses
