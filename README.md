# Cruze Starter (Frontend + Backend + Matching Microservice)

A minimal, *teachable* implementation of your campus carpooling stack:

- **Frontend**: React + Vite + Tailwind + `@supabase/supabase-js`
- **Backend**: Node.js + Express (Stripe webhooks, Maps proxy, Supabase server ops)
- **Matching Microservice**: FastAPI (Python) for ranking driver↔rider matches
- **Data**: Supabase (managed Postgres, Auth, Realtime)
- **Payments**: Stripe Checkout + Webhook → Backend → Supabase
- **Maps**: Google Maps/Places/Distance Matrix via Backend proxy
- **Docker**: Local dev (optional), easy migration to AWS/Render
- **CI/CD**: GitHub Actions examples

> This is a teaching scaffold: clear structure, safe-by-default env usage, and end-to-end flow demos.
> You will add real UI, schemas, and matching logic as you iterate.
> All keys are **env vars**. No secrets are committed.

---

## Quick Start (Local, no Docker)

> Requirements: Node 18+, Python 3.10+, npm, pip

1) **Create Supabase project** (dashboard) and **Stripe account** (test mode).  
   Copy these keys (you'll paste them soon):
   - Supabase `PROJECT_URL` and **anon** key (frontend), and **service role** key (backend)
   - Stripe `STRIPE_SECRET_KEY` and webhook secret (after step 6)
   - Google Maps `GOOGLE_MAPS_API_KEY`

2) **Install & run backend**:
```bash
cd cruze-backend
npm install
cp .env.example .env
# Open .env and fill: SUPABASE_URL, SUPABASE_SERVICE_ROLE, STRIPE_SECRET_KEY, GOOGLE_MAPS_API_KEY, FRONTEND_URL
npm run dev
# Server on http://localhost:5050
```

3) **Install & run matching service**:
```bash
cd ../cruze-matching
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill BACKEND_INTERNAL_TOKEN (any long random string), and optionally GOOGLE_MAPS_API_KEY
uvicorn app:app --reload --port 8001
# Service on http://localhost:8001
```

4) **Install & run frontend**:
```bash
cd ../cruze-frontend
npm install
cp .env.example .env
# Fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_BACKEND_URL=http://localhost:5050
npm run dev
# Frontend on http://localhost:5173
```

5) **Test a flow**
- In the app, create a trip, then request a seat.  
- Click “Find Matches” (mock) and observe results return from the FastAPI service.

6) **Stripe webhook (local)**
- Install Stripe CLI: https://stripe.com/docs/stripe-cli
```bash
stripe login   # once
stripe listen --forward-to localhost:5050/webhooks/stripe
```
- Copy the **webhook secret** the CLI prints and put it in `cruze-backend/.env` as `STRIPE_WEBHOOK_SECRET`.

7) **Maps**  
- Put your Google key in `cruze-backend/.env`. Try `/api/maps/distance?origins=...&destinations=...`

---

## One-command local with Docker (optional)

```bash
# From repo root
docker compose up --build
# Frontend http://localhost:5173, Backend http://localhost:5050, Matching http://localhost:8001
```

> You still use **hosted Supabase** and **Stripe** from your local env. No DB container needed.

---

## Deploy (simplest path)

### Frontend → Vercel (fast)
- Import `cruze-frontend` repo into Vercel, set env `VITE_*` variables, and deploy.
- Set **CORS** on backend to allow your Vercel domain.

### Backend/Matching → Render (zero-config Dockerless)
- Create new **Web Service** on Render from `cruze-backend` GitHub repo:
  - Build Command: `npm install`
  - Start Command: `npm run start`
  - Env Vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `GOOGLE_MAPS_API_KEY`, `FRONTEND_URL`, `MATCHING_URL`
- Repeat for `cruze-matching`:
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `uvicorn app:app --host 0.0.0.0 --port 8001`

> Add your Render URLs back into `FRONTEND_URL` and `MATCHING_URL` as needed.

### AWS (Elastic Beanstalk, simple single-container per service)
- Build backend Docker image locally or via GH Actions
- Create **two EB apps** (backend, matching), each with **Docker** platform
- Upload Dockerrun files or “Upload and deploy” with generated `Dockerfile` context
- Set env vars on each environment
- Point frontend to EB URLs

See `infra/` for sample GH Actions and EB notes.

---

## Monorepo layout

```
cruze-frontend/   React + Vite + Tailwind + Supabase client
cruze-backend/    Node + Express (Stripe, Maps proxy, Supabase server ops)
cruze-matching/   FastAPI microservice (ranking stub)
infra/            Docker & GitHub Actions examples
```

---

## Security notes
- Never expose service-role keys to the browser. Only put them in the backend.
- Lock down CORS to your frontend domain in production.
- Verify Stripe webhooks using `STRIPE_WEBHOOK_SECRET`.
- If you later move off Supabase Auth, replicate RLS rules in backend.

---

## Resume bullets you can honestly claim (covered by this repo)
- Built full-stack carpooling platform with **React/Vite/Tailwind**, **Node/Express**, **FastAPI**, and **Supabase**.
- Integrated **Stripe** for payments with webhook → backend → Supabase updates.
- Implemented **Google Maps** distance/ETA proxy and clean API boundaries.
- Containerized services with **Docker** and provided **CI/CD** examples (GitHub Actions).
