# 0001. Deployment — Vercel, Render, Supabase

- **Status:** Ready
- **Owner:** unassigned
- **Related:** [ADR 0005](../decisions/0005-supabase-is-the-database-not-the-backend.md),
  [reference/deployments](../reference/deployments.md),
  [reference/environment](../reference/environment.md)

## Goal

Ani reachable at a public URL, with a database that does not expire, so a link
can be shared with a real farm in Naval and they can open it on their phone.

## Scope

**In scope**

- Supabase project holding Postgres, migrated and seeded
- API on Render, reachable and healthy
- PWA on Vercel, proxying `/api` to Render so the browser stays on one origin
- A keep-awake ping so the first visitor of the day does not wait a minute

**Out of scope**

- A custom domain — worth doing, not worth blocking the first share on
- Product photos — [plan 0002](./0002-product-photos.md)
- Any paid tier

## Prerequisites

- GitHub repository pushed, with `main` as the default branch
- Accounts on Supabase, Render, and Vercel
- `npm run build` passes locally

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Database | 0 / 2 | Not started |
| 2. API | 0 / 3 | Not started |
| 3. Web | 0 / 3 | Not started |

---

## Phase 1 — Database

### Step 1.1 — Create the Supabase project

- [ ] **Action.** Create a project in the region closest to the Philippines
      (Singapore). Copy the connection string from Project settings → Database
      → Connection string → URI, and use the **session pooler** URI rather
      than the direct connection: Render's free instance opens more
      connections than the direct limit allows.
- [ ] **Verify.** `psql "$DATABASE_URL" -c 'select 1'` returns one row.

### Step 1.2 — Migrate and seed

- [ ] **Action.** With `DATABASE_URL` set to the Supabase URI, run
      `npm --prefix backend run db:migrate` then `npm --prefix backend run db:seed`.
- [ ] **Verify.** `psql "$DATABASE_URL" -c 'select count(*) from municipalities'`
      returns 8.

---

## Phase 2 — API

### Step 2.1 — Create the Render web service

- [ ] **Action.** New Web Service from the repository. Root directory
      `backend`, build `npm install && npm run build`, start `npm start`,
      health check path `/api/v1/health`.
- [ ] **Verify.** The first deploy reaches "Live".

### Step 2.2 — Set environment variables

- [ ] **Action.** In the Render dashboard set `NODE_ENV=production`,
      `DATABASE_URL`, `SESSION_SECRET` (`openssl rand -base64 48`), and
      `CORS_ORIGINS` set to the Vercel URL. Leave the `SUPABASE_*` variables
      empty until plan 0002 — blank is treated as absent and photo upload
      stays disabled, which is intended.
- [ ] **Verify.** `curl https://<service>.onrender.com/api/v1/health` returns
      `{"data":{"status":"ok","database":"up",...}}`.

### Step 2.3 — Keep it awake

- [ ] **Action.** Add `.github/workflows/keep-awake.yml` pinging
      `/api/v1/health` every 10 minutes during waking hours in PHT.
- [ ] **Verify.** Two consecutive scheduled runs succeed, and Render's metrics
      show no cold start between them.

Render's free tier sleeps a service after 15 minutes idle and takes about a
minute to wake. For a marketplace someone opens from a Facebook link, a
one-minute blank screen is the whole first impression.

---

## Phase 3 — Web

### Step 3.1 — Point the rewrite at the real API

- [ ] **Action.** In `frontend/vercel.json`, set the `/api/:path*` destination
      to the Render URL from step 2.1.
- [ ] **Verify.** The file contains the deployed hostname, not the placeholder.

### Step 3.2 — Create the Vercel project

- [ ] **Action.** Import the repository. Root directory `frontend`, framework
      Vite. Leave `VITE_API_BASE_URL` unset so the client uses the relative
      `/api/v1` and the rewrite keeps it same-origin — session cookies depend
      on that.
- [ ] **Verify.** The deployed site lists produce, and the network tab shows
      `/api/v1/products` returning 200 from the Vercel origin.

### Step 3.3 — Close the CORS loop

- [ ] **Action.** Set `CORS_ORIGINS` on Render to the Vercel production URL.
- [ ] **Verify.** Registering an account on the deployed site succeeds and the
      session survives a reload.

---

## Acceptance

- [ ] The catalogue loads at the Vercel URL with no console errors
- [ ] Register, sign in, and reload keeps the session
- [ ] A farm can register and is visibly `pending`
- [ ] `/api/v1/health` reports `database: up`
- [ ] Chrome on Android offers "Add to Home Screen"
- [ ] Two consecutive keep-awake runs pass

## Follow-ups

- Custom domain and HTTPS redirect
- Facebook link previews, which need SSR or prerendering — see the debt
  section in [architecture](../explanation/architecture.md)
- Backups beyond Supabase's free-tier retention
