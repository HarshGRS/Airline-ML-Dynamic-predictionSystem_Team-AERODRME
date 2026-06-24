def test_create_and_list_saved_search(client, auth_headers):
    headers = auth_headers(email="search1@example.com")
    create = client.post(
        "/api/v1/saved-searches",
        json={"source_city": "Delhi", "destination_city": "Mumbai", "flight_class": "Business"},
        headers=headers,
    )
    assert create.status_code == 201
    assert create.json()["flight_class"] == "Business"

    listed = client.get("/api/v1/saved-searches", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_delete_saved_search(client, auth_headers):
    headers = auth_headers(email="search2@example.com")
    create = client.post(
        "/api/v1/saved-searches",
        json={"source_city": "Delhi", "destination_city": "Mumbai"},
        headers=headers,
    )
    search_id = create.json()["id"]

    delete = client.delete(f"/api/v1/saved-searches/{search_id}", headers=headers)
    assert delete.status_code == 204
