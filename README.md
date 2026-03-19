# Wrpper App — Setup & Deploy

## Local dev

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL

npm install
npm run dev
# → http://localhost:5173
```

## Railway deploy

1. Push this repo to GitHub
2. In Railway → New Project → Deploy from GitHub repo → select this repo
3. Add environment variables in Railway:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL=https://api.wrpper.com`
4. Railway auto-detects Vite — it will run `npm run build` and serve `dist/`
5. Set custom domain → `app.wrpper.com`

## Backend: add connections routes

Copy `backend_connections.py` into your FastAPI repo as `app/api/connections.py`, then in `main.py`:

```python
from app.api.connections import router as connections_router
app.include_router(connections_router, prefix="/connections", tags=["connections"])
```

Requires `httpx` — add to requirements.txt if not already there.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview dashboard with CAPI health strip + KPIs |
| `/connections` | Meta CAPI test console — verify token, send test events, inspect match quality |
| `/analytics` | Attribution events table — platform + influencer ID columns |
| `/influencers` | Leaderboard ranked by clicks |
| `/settings` | Account + wrp.js pixel snippet |
| `/signin` | Supabase auth |
| `/signup` | Supabase auth |
