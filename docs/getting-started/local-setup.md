# Local setup

Clone to a running app with data. Should take about ten minutes, most of it
waiting on `npm install`.

---

## Prerequisites

| Need | Why | Check |
|---|---|---|
| Node 20+ | Both workspaces | `node -v` |
| Docker | Local Postgres | `docker --version` |
| Git | — | `git --version` |

## 1. Install

```bash
git clone https://github.com/ELITES-ORG/ani.git
cd ani
npm run setup
```

`npm run setup` copies both `.env.example` files, installs the git hooks, and
installs dependencies in `backend/` and `frontend/`.

The hooks matter: a `commit-msg` hook rejects AI attribution trailers, which
CI also checks. See [ADR 0014](../decisions/0014-ai-attribution-is-blocked-by-a-check.md).

## 2. Start the database

```bash
npm run db:up
```

Postgres 17 in Docker, on **port 5433** — not the default. The sibling Bilikha
project runs its own Postgres on 5432 and both need to be up at once.

```bash
docker ps --filter name=ani-postgres
```

Wait for `(healthy)`.

## 3. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

The seed inserts Biliran's eight municipalities and a starter set of
barangays. It is idempotent — safe to re-run.

## 4. Set a session secret

`backend/.env` ships with a placeholder `SESSION_SECRET`. It must be at least
32 characters or the API refuses to start.

```bash
openssl rand -base64 48
```

Leave the `SUPABASE_*` variables empty. Blank is treated as absent, product
photos stay disabled, and everything else works.

## 5. Run it

Two terminals:

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Open http://localhost:5173. The catalogue is empty, which is correct — no farm
has listed anything yet.

---

## Get something into the catalogue

```bash
API=http://localhost:4000/api/v1

# An account
curl -s -c /tmp/ani -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"username":"juanfarmer","password":"harvest2026","fullName":"Juan Dela Cruz","phone":"0917 123 4567"}'

# A farm — created pending, so it cannot list yet
curl -s -b /tmp/ani -X POST $API/vendors/register -H 'Content-Type: application/json' \
  -d '{"farmName":"Dela Cruz Farm","municipalitySlug":"naval","barangaySlug":"caraycaray"}'
```

Approving a farm is a SQL update until [plan 0003](../plans/0003-admin-approval-queue.md)
ships:

```bash
docker exec ani-postgres psql -U ani -d ani -c "update vendors set status='approved';"
```

Then list produce:

```bash
curl -s -b /tmp/ani -X POST $API/products -H 'Content-Type: application/json' \
  -d '{"name":"Kangkong","category":"vegetables","pricePesos":25,"stockAmount":40,"unit":"bundle"}'
```

Reload the browser and it is there.

---

## Verify before you commit

```bash
npm run typecheck
npm run lint
npm test
npm run docs:check
```

---

## When something is wrong

**`SESSION_SECRET must be at least 32 characters`** — step 4.

**`Bind for 0.0.0.0:5433 failed`** — something else holds the port.
`docker ps --filter publish=5433` will say what.

**`ECONNREFUSED` on 5433** — the container is not up or not healthy yet.
`npm run db:up` and wait for `(healthy)`.

**The API starts but every query fails** — migrations have not run against
this database. `npm run db:migrate`.

**Changed the schema and Drizzle disagrees** — regenerate rather than editing
the database: `npm run db:generate && npm run db:migrate`. To start clean,
`npm run db:reset`.

**Signed in, then 401 on the next request** — the browser is not on the same
origin as the API. Use the Vite dev server on 5173, which proxies `/api`, not
the API's port directly.
