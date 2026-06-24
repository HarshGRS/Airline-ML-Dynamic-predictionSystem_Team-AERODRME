def test_signup_creates_user_and_returns_token(client):
    response = client.post(
        "/api/v1/auth/signup", json={"email": "alice@example.com", "password": "supersecret123"}
    )
    assert response.status_code == 201
    body = response.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_signup_rejects_duplicate_email(client):
    payload = {"email": "bob@example.com", "password": "supersecret123"}
    client.post("/api/v1/auth/signup", json=payload)
    response = client.post("/api/v1/auth/signup", json=payload)
    assert response.status_code == 409


def test_signup_rejects_short_password(client):
    response = client.post(
        "/api/v1/auth/signup", json={"email": "carol@example.com", "password": "short"}
    )
    assert response.status_code == 422


def test_login_with_correct_credentials_succeeds(client):
    payload = {"email": "dave@example.com", "password": "supersecret123"}
    client.post("/api/v1/auth/signup", json=payload)
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/v1/auth/signup", json={"email": "erin@example.com", "password": "supersecret123"}
    )
    response = client.post(
        "/api/v1/auth/login", json={"email": "erin@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client, auth_headers):
    headers = auth_headers(email="frank@example.com")
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "frank@example.com"
