from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

import app as match_app
from app import Candidate


client = TestClient(match_app.app)


@pytest.fixture(autouse=True)
def reset_internal_token():
    """Ensure token changes in tests do not leak between cases."""
    original = match_app.INTERNAL_TOKEN
    match_app.INTERNAL_TOKEN = ""
    yield
    match_app.INTERNAL_TOKEN = original


def test_score_prefers_future_small_party_with_window():
    future_date = (datetime.utcnow().date() + timedelta(days=1)).isoformat()
    candidate = Candidate(
        id="c1",
        origin="Campus",
        destination="Downtown",
        seats_needed=1,
        status="pending",
        time_window="3-5pm",
        date=future_date,
        created_at=datetime.utcnow().isoformat(),
    )

    score, reason = match_app.score_candidate(candidate)

    assert score > 0.75
    assert "has time window" in reason
    assert "date ok" in reason


def test_score_penalizes_missing_fields_and_past_date():
    candidate = Candidate(
        id="c2",
        origin=None,
        destination=None,
        seats_needed=6,
        status="approved",
        time_window=None,
        date="2020-01-01",
    )

    score, reason = match_app.score_candidate(candidate)

    assert score < 0.4
    assert "missing origin/destination" in reason
    assert "date in past" in reason
    assert "status approved" in reason


def test_match_endpoint_orders_by_score_and_requires_token():
    match_app.INTERNAL_TOKEN = "secret-token"
    payload = {
        "tripId": "trip-123",
        "candidates": [
            {
                "id": "fit",
                "origin": "A",
                "destination": "B",
                "seats_needed": 1,
                "status": "pending",
                "time_window": "2-4pm",
                "date": (datetime.utcnow().date() + timedelta(days=2)).isoformat(),
            },
            {
                "id": "late",
                "origin": "A",
                "destination": "B",
                "seats_needed": 5,
                "status": "pending",
                "time_window": None,
                "date": "2020-01-01",
            },
        ],
    }

    res = client.post(
        "/match",
        headers={"x-internal-token": "secret-token"},
        json=payload,
    )

    assert res.status_code == 200
    data = res.json()
    assert data["tripId"] == "trip-123"
    assert data["count"] == 2
    assert data["matches"][0]["id"] == "fit"
    assert data["matches"][0]["score"] >= data["matches"][1]["score"]


def test_match_rejects_when_token_missing():
    match_app.INTERNAL_TOKEN = "secret-token"

    res = client.post("/match", json={"tripId": "trip-1", "candidates": []})

    assert res.status_code == 401
    assert res.json()["detail"] == "invalid internal token"
