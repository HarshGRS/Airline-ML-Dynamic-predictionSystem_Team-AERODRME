def test_create_watchlist_requires_auth(client):
    response = client.post(
        "/api/v1/watchlists",
        json={"source_city": "Delhi", "destination_city": "Mumbai", "target_price": 5000},
    )
    assert response.status_code == 401


def test_create_and_list_watchlist(client, auth_headers):
    headers = auth_headers(email="watch1@example.com")
    create = client.post(
        "/api/v1/watchlists",
        json={"source_city": "Delhi", "destination_city": "Mumbai", "target_price": 5000},
        headers=headers,
    )
    assert create.status_code == 201

    listed = client.get("/api/v1/watchlists", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["target_price"] == 5000


def test_create_watchlist_rejects_same_source_and_destination(client, auth_headers):
    headers = auth_headers(email="watch2@example.com")
    response = client.post(
        "/api/v1/watchlists",
        json={"source_city": "Delhi", "destination_city": "Delhi", "target_price": 5000},
        headers=headers,
    )
    assert response.status_code == 422


def test_delete_watchlist(client, auth_headers):
    headers = auth_headers(email="watch3@example.com")
    create = client.post(
        "/api/v1/watchlists",
        json={"source_city": "Delhi", "destination_city": "Mumbai", "target_price": 5000},
        headers=headers,
    )
    watchlist_id = create.json()["id"]

    delete = client.delete(f"/api/v1/watchlists/{watchlist_id}", headers=headers)
    assert delete.status_code == 204

    listed = client.get("/api/v1/watchlists", headers=headers)
    assert listed.json() == []


def test_cannot_delete_another_users_watchlist(client, auth_headers):
    owner_headers = auth_headers(email="watch-owner@example.com")
    create = client.post(
        "/api/v1/watchlists",
        json={"source_city": "Delhi", "destination_city": "Mumbai", "target_price": 5000},
        headers=owner_headers,
    )
    watchlist_id = create.json()["id"]

    other_headers = auth_headers(email="watch-intruder@example.com")
    delete = client.delete(f"/api/v1/watchlists/{watchlist_id}", headers=other_headers)
    assert delete.status_code == 404
