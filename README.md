# AgroChem Invest — Main Website (users)

This is the **user-facing website** only (React + Vite + Neon Postgres).
The admin panel is a separate project: `agrochem-invest-admin`.

Both projects talk to the **same Neon database** (same `DATABASE_URL`), so anything
the admin does (approve deposits, create plans, edit users...) shows up here automatically.

The browser never sees the database password: `server/` (Node) holds `DATABASE_URL`
from `.env` and exposes a small `/api`; `public/db-client.js` gives `app-logic.js`
the same `db.ref()` API it used with Firebase.

## Run
1. Copy your media files (`1234.png`, `hero-banner.png`, any others) into `public/`.
2. `npm install`
3. Development: `npm run dev:all` (server on :3001 + Vite on :5173)
   Production:  `npm run build` then `npm start` (serves the site and the API on one port, default 3001)

The table `rtdb_nodes` is created automatically on first start.
Run `npm test` to check the data layer without a database.

## Important
- Rotate your Neon password (it was shared in plain text) and update `.env` in BOTH projects.
- Never commit `.env`. On a host (Render, Railway, VPS...) set `DATABASE_URL` as an environment variable.
- Existing Firebase data is not migrated; the database starts empty.
