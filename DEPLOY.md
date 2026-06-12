# FishGrow Deployment Guide

Two free-tier services, no card required, total cost: $0/month.

```
┌──────────────────┐         ┌──────────────────────┐
│  Vercel (Free)   │ ──API──▶│  Railway (Free)      │
│  Next.js frontend│         │  NestJS backend      │
│  fishgrow.vercel │         │  *.up.railway.app    │
│  .app            │         │  + SQLite volume     │
└──────────────────┘         └──────────────────────┘
```

## 1. Backend on Railway

1. Go to https://railway.app → New Project → Deploy from GitHub repo → select `hnlisf/fishgrow`.
2. Railway auto-detects Node. Configure:

   | Setting | Value |
   |---|---|
   | Root Directory | `backend` |
   | Build Command | `npm ci && npx prisma generate && npx prisma migrate deploy && npx prisma db seed && npm run build` |
   | Start Command | `node --enable-source-maps dist/src/main.js` |
   | Healthcheck Path | `/api/fish-species` |

3. Add a **Volume** mounted at `/app/backend/prisma` (this is where `dev.db` lives; without a volume the SQLite data is lost on every redeploy).
4. Add an env var `DATABASE_URL=file:./prisma/dev.db`.
5. Wait for first deploy. Note the public URL, e.g. `https://fishgrow-backend.up.railway.app`.

**Verify**: open `https://fishgrow-backend.up.railway.app/api/docs` — Swagger should load.

## 2. Frontend on Vercel

1. Go to https://vercel.com → New Project → import `hnlisf/fishgrow`.
2. Configure:

   | Setting | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Build Command | `npm run build` (default) |
   | Output Directory | `.next` (default) |
   | Install Command | `npm ci` (default) |

3. Add env var `NEXT_PUBLIC_API_URL=https://fishgrow-backend.up.railway.app` (the Railway URL from step 1).
4. Deploy.

**Verify**: open the Vercel URL → it should redirect to `/tank` → click "新建鱼缸" → "选鱼" → the dropdown should show 10 species in your locale.

## 3. Local dev (the fast feedback loop)

```bash
# Terminal 1 — backend
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run build
node --enable-source-maps dist/src/main.js     # :3000

# Terminal 2 — frontend
cd frontend
npm install
npm run build
npm run start                                 # :3001
```

Open http://localhost:3001/tank.

## 4. Public LAN access (for the demo)

If you want to access the app from a phone or another machine on the same network:

1. Edit `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://<server-lan-ip>:3000
   ```
2. Rebuild & restart the frontend: `cd frontend && npm run build && npm run start`.

Without this, the frontend tries to call `http://localhost:3000` from the browser, which is the browser's localhost, not the server's.

## 5. First-deploy gotchas

- **Volume path matters.** Railway containers restart with a fresh filesystem. The SQLite file lives at `<workdir>/prisma/dev.db` (relative to where the start command runs). Mount the volume at that path or the database is wiped on every restart.
- **Migrations run on every deploy.** `prisma migrate deploy` is idempotent; safe to run repeatedly. Don't run `prisma migrate dev` in prod — it requires a shadow DB.
- **Seed is idempotent.** `prisma db seed` checks for existing species before inserting; safe to run on every deploy.
- **CORS.** The backend has CORS enabled for `*` in dev. Tighten this in production by setting `CORS_ORIGIN` to your Vercel domain in the Railway env vars.
- **Free tier sleeps.** Railway's free plan spins down after inactivity. First request after sleep takes ~30s. Vercel does NOT have this problem on the free tier.
