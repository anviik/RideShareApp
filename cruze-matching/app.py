# cruze-matching/app.py
import os
from datetime import datetime
from typing import List, Optional, Tuple

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI()


class Candidate(BaseModel):
    id: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    date: Optional[str] = None  # ISO date string from Supabase
    time_window: Optional[str] = None
    seats_needed: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = None
    trip_id: Optional[str] = None
    created_at: Optional[str] = None


class MatchRequest(BaseModel):
    tripId: str
    candidates: List[Candidate]


INTERNAL_TOKEN = os.getenv("BACKEND_INTERNAL_TOKEN")


def _parse_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        return None


def _parse_datetime(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


def score_candidate(c: Candidate) -> Tuple[float, str]:
    """
    Heuristic scorer to rank rider requests for a driver trip.
    Higher is better. Bounds are clamped to 0..1 to keep outputs stable.
    """
    score = 0.5
    reasons = []

    # Penalize non-pending requests
    if c.status and c.status.lower() != "pending":
        score -= 0.4
        reasons.append(f"status {c.status}")

    # Seats: prefer smaller asks, gently penalize large groups
    seats = c.seats_needed or 1
    if seats == 1:
        score += 0.1
        reasons.append("solo rider")
    elif seats == 2:
        score += 0.08
        reasons.append("small party")
    elif seats == 3:
        score += 0.05
        reasons.append("moderate party")
    elif seats == 4:
        score += 0.02
        reasons.append("medium party")
    else:
        score -= 0.12
        reasons.append(f"large party ({seats})")

    # Require origin/destination
    if not c.origin or not c.destination:
        score -= 0.25
        reasons.append("missing origin/destination")

    # Prefer requests with a time window
    if c.time_window:
        score += 0.08
        reasons.append("has time window")
    else:
        score -= 0.04
        reasons.append("no time window")

    # Date weighting
    today = datetime.utcnow().date()
    if c.date:
        req_date = _parse_date(c.date)
        if req_date:
            if req_date >= today:
                score += 0.07
                reasons.append("date ok")
            else:
                score -= 0.2
                reasons.append("date in past")
        else:
            score -= 0.05
            reasons.append("invalid date")

    # Recency of request
    if c.created_at:
        created_dt = _parse_datetime(c.created_at)
        if created_dt:
            age_days = (today - created_dt.date()).days
            if age_days <= 1:
                score += 0.05
                reasons.append("fresh request")
            elif age_days <= 7:
                score += 0.02
                reasons.append("recent request")
            elif age_days > 30:
                score -= 0.05
                reasons.append("stale request")

    score = max(0.0, min(1.0, score))
    reason_str = ", ".join(reasons) if reasons else "default weighting"
    return score, reason_str


def check_internal_token(token: str):
    if INTERNAL_TOKEN and token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="invalid internal token")


@app.get("/")
def root():
    return {"status": "ok", "service": "matching"}


@app.get("/match/health")
def match_health():
    return {"status": "ok", "service": "matching", "endpoint": "match/health"}


@app.post("/match")
def match_candidates(
    payload: MatchRequest,
    x_internal_token: str = Header(default="", convert_underscores=False),
    x_internal_token_dash: str = Header(default="", convert_underscores=False, alias="x-internal-token"),
):
    """
    Rank rider requests for a given trip.
    - No DB lookups; relies on candidates supplied by the backend.
    - Returns scored list sorted by best match first.
    """
    token = x_internal_token or x_internal_token_dash
    check_internal_token(token)

    if not payload.candidates:
        return {"tripId": payload.tripId, "matches": [], "count": 0}

    scored = []
    for c in payload.candidates:
        score, reason = score_candidate(c)
        scored.append(
            {
                "id": c.id,
                "score": round(score, 3),
                "reason": reason,
                "candidate": c,
            }
        )

    scored.sort(key=lambda item: item["score"], reverse=True)

    return {
        "tripId": payload.tripId,
        "count": len(scored),
        "matches": scored,
    }
