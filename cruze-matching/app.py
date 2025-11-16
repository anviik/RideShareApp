import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

INTERNAL = os.getenv("BACKEND_INTERNAL_TOKEN", "")

app = FastAPI(title="Cruze Matching Service")

class Candidate(BaseModel):
    id: int
    trip_id: int
    status: str = "pending"

class MatchRequest(BaseModel):
    tripId: int
    candidates: List[Candidate]



@app.post("/match")
def match(req: MatchRequest, x_internal_token: Optional[str] = Header(None)):
    if x_internal_token != INTERNAL:
        raise HTTPException(status_code=401)
    results = [
        {"trip_id": c.trip_id, "score": 1.0 - (i * 0.1)}
        for i, c in enumerate(req.candidates)
    ]
    return {"matches": results}
