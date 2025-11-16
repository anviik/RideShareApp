# AWS Elastic Beanstalk quick notes (single-container per service)

## Backend (Node/Express)
1. Zip `cruze-backend/` contents (Dockerfile included if you want Docker), upload to new EB app (Node or Docker platform)
2. Set env vars in EB console: SUPABASE_URL, SUPABASE_SERVICE_ROLE, FRONTEND_URL, MATCHING_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, GOOGLE_MAPS_API_KEY, INTERNAL_TOKEN
3. Deploy, confirm health, note the EB URL

## Matching (FastAPI)
1. Zip `cruze-matching/` (with Dockerfile) and create a second EB app (Docker platform recommended)
2. Set env vars: BACKEND_INTERNAL_TOKEN, GOOGLE_MAPS_API_KEY
3. Deploy and copy the URL into Backend's MATCHING_URL

## Frontend
- Use Vercel or Netlify for best DX; set VITE_* vars in dashboard
- Point backend CORS to the deployed frontend domain
