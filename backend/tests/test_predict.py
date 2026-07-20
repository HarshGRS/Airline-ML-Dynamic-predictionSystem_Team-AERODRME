import copy


def test_predict_happy_path(client, valid_predict_payload):
    response = client.post("/api/v1/predict", json=valid_predict_payload)
    assert response.status_code == 200
    body = response.json()
    assert body["predicted_price"] > 0
    assert body["confidence_low"] <= body["predicted_price"] <= body["confidence_high"]
    assert body["currency"] == "INR"
    assert "model_version" in body


def test_predict_price_within_plausible_bounds(client, valid_predict_payload):
    response = client.post("/api/v1/predict", json=valid_predict_payload)
    body = response.json()
    # Training data price range was roughly INR 1,100 - 123,000 (see docs/model_card.md).
    assert 500 <= body["predicted_price"] <= 200_000


def test_predict_business_class_costs_more_than_economy(client, valid_predict_payload):
    economy = client.post("/api/v1/predict", json=valid_predict_payload).json()

    business_payload = copy.deepcopy(valid_predict_payload)
    business_payload["class"] = "Business"
    business = client.post("/api/v1/predict", json=business_payload).json()

    assert business["predicted_price"] > economy["predicted_price"]


def test_predict_rejects_same_source_and_destination(client, valid_predict_payload):
    payload = copy.deepcopy(valid_predict_payload)
    payload["destination_city"] = payload["source_city"]
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422


def test_predict_rejects_invalid_enum_value(client, valid_predict_payload):
    payload = copy.deepcopy(valid_predict_payload)
    payload["airline"] = "NotARealAirline"
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422


def test_predict_rejects_days_left_out_of_range(client, valid_predict_payload):
    payload = copy.deepcopy(valid_predict_payload)
    payload["days_left"] = 999
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 422


def test_predict_flags_out_of_distribution_duration(client, valid_predict_payload):
    payload = copy.deepcopy(valid_predict_payload)
    payload["duration"] = 49.5  # near the extreme edge of training data
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    assert response.json()["out_of_distribution"] is True
