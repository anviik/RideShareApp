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


def score_candidate(c: Candidate) -> Tuple[float, str]:
    """Heuristic scorer to rank rider requests for a driver trip."""
    score = 1.0
    reasons = []

    # Penalize non-pending requests
    if c.status and c.status.lower() != "pending":
        score -= 0.35
        reasons.append(f"status {c.status}")

    # Seats: prefer smaller asks, cap penalty for large groups
    seats = c.seats_needed or 1
    if seats <= 2:
        score += 0.05
        reasons.append("small party")
    elif seats >= 5:
        score -= 0.15
        reasons.append("large party")

    # Require origin/destination
    if not c.origin or not c.destination:
        score -= 0.25
        reasons.append("missing origin/destination")

    # Prefer requests with a time window
    if c.time_window:
        score += 0.05
        reasons.append("has time window")
    else:
        score -= 0.05
        reasons.append("no time window")

    # Slight boost if date is present and not in the past
    if c.date:
        try:
            req_date = datetime.fromisoformat(c.date).date()
            if req_date >= datetime.utcnow().date():
                score += 0.05
                reasons.append("date present")
            else:
                score -= 0.05
                reasons.append("date in past")
        except ValueError:
            reasons.append("invalid date")

    # Keep score within 0..1 bounds
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
):
    """
    Rank rider requests for a given trip.
    - No DB lookups; relies on candidates supplied by the backend.
    - Returns scored list sorted by best match first.
    """
    check_internal_token(x_internal_token)

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
