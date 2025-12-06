# cruze-matching/app.py
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok", "service": "matching"}

@app.get("/match/health")
def match_health():
    return {"status": "ok", "service": "matching", "endpoint": "match/health"}

# TODO: real /match endpoint later
