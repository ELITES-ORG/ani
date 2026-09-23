# Environment variables

Every variable is validated at boot by `backend/src/config/env.ts`. A missing
or malformed one exits the process with a message naming the field, rather
than surfacing as a confusing error inside a handler an hour later.

Secrets are entered in host dashboards. They are never committed — add each
new variable to the relevant `.env.example` with a safe placeholder.

---

## Backend — `backend/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` \| `test` \| `production` |
| `PORT` | no | `4000` | Render sets this itself |
| `DATABASE_URL` | **yes** | — | Local: `postgres://ani:ani@localhost:5433/ani`. Production: the Supabase **session pooler** URI |
| `CORS_ORIGINS` | no | `http://localhost:5173` | Comma-separated. Must list the Vercel URL in production |
| `LOG_LEVEL` | no | `info` | `fatal` … `trace` |
| `SESSION_SECRET` | **yes** | — | 32+ characters. `openssl rand -base64 48` |
| `SESSION_TTL_DAYS` | no | `30` | |
| `SUPABASE_URL` | no | — | Blank disables photo upload |
| `SUPABASE_SERVICE_ROLE_KEY` | no | — | Server only. Never ship to the browser |
| `SUPABASE_STORAGE_BUCKET` | no | `produce` | |

**The Supabase variables are optional on purpose.** Requiring them means a
deploy that forgets one exits at boot and takes down browsing, ordering, and
registration — for a subsystem that only serves photos. Blank disables uploads
and leaves everything else working.

**Blank is treated as absent.** A field someone cleared in a dashboard arrives
as `""`, which is present. Without that handling, an intentionally empty
optional variable fails validation and crashes the boot it was meant to
protect.

**Use the session pooler URI in production.** Render's free instance opens
more connections than Supabase's direct limit allows.

## Frontend — `frontend/.env`

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | no | `/api/v1` | **Leave unset.** Vite proxies in dev and Vercel rewrites in production, keeping the browser same-origin so session cookies work |

Only `VITE_`-prefixed variables reach the bundle. Anything secret stays on the
API.

Setting `VITE_API_BASE_URL` to a cross-origin URL will break sign-in: the
session cookie is `sameSite=lax`.

---

## Where each one lives in production

| Where | Holds |
|---|---|
| Render | `NODE_ENV`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGINS`, `SUPABASE_*` |
| Vercel | Nothing required |
| Supabase | The database itself |
