# 0001. Deployment — Supabase, Render, Vercel

- **Status:** Ready
- **Owner:** unassigned
- **Related:** [ADR 0005](../decisions/0005-supabase-is-the-database-not-the-backend.md),
  [reference/deployments](../reference/deployments.md),
  [reference/environment](../reference/environment.md)

## Goal

Ani reachable at a public URL, backed by a database that does not expire.

**This is an infrastructure rehearsal, not a launch.** Two screens are still
missing — there is no admin approval UI and no add-produce form — so a farm
that registers on the deployed site reaches "under review" and stops. That is
expected. Deploying now is worth doing because every problem below is one that
cannot happen locally, and they are far cheaper to debug against seven
endpoints than against thirty.

## Scope

**In scope**

- Supabase project holding Postgres, migrated and seeded
- API on Render, healthy, reading that database
- PWA on Vercel, proxying `/api` to Render so the browser stays on one origin
- The keep-awake ping switched on

**Out of scope**

- A custom domain
- Product photos — [plan 0002](./0002-product-photos.md)
- The missing screens — [plan 0003](./0003-admin-approval-queue.md)
- Any paid tier

## Prerequisites

- `main` pushed to `ELITES-ORG/ani` and CI green
- Accounts on [Supabase](https://supabase.com/dashboard),
  [Render](https://dashboard.render.com), and [Vercel](https://vercel.com)
- `npm run build` passes locally

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Database | 0 / 4 | Not started |
| 2. API | 0 / 5 | Not started |
| 3. Web | 0 / 5 | Not started |
| 4. Keep awake | 0 / 2 | **Deferred** — see the note in phase 4 |

Dashboard URLs move. If a link 404s, navigate from the product's dashboard
home rather than assuming the step is wrong.

---

## Phase 1 — Database (Supabase)

### Step 1.1 — Create the project

- [ ] **Action.** Go to **<https://supabase.com/dashboard/new>**.
      - Organisation: your own, or create `ELITES-ORG`
      - Name: `ani` — not the pre-filled "<your handle>'s Project"
      - Database password: generate one and **save it now** — Supabase shows
        it once and the connection string needs it
      - Region: **Southeast Asia (Singapore)**, the closest to Biliran
      - Plan: Free
      - GitHub (optional): **leave empty**
      - Security: **untick "Enable Data API"**. Leave "Enable automatic RLS"
        unticked.
- [ ] **Verify.** The project page reaches "Project is ready" (one to two
      minutes), and Settings → API does not offer a public REST URL for the
      `public` schema.

**Untick the Data API.** It is on by default, together with "Automatically
expose new tables", and automatic RLS is off. That combination publishes every
table Drizzle creates — including `users` with its `password_hash` column, and
`sessions` — over HTTP to anyone holding the project's anon key, which is
designed to be public. Supabase's own hint on that checkbox is warning about
the same thing.

Ani never uses PostgREST ([ADR 0005](../decisions/0005-supabase-is-the-database-not-the-backend.md)),
so switching the whole surface off is better than trying to lock it down with
policies we do not otherwise maintain.

It costs nothing here. Drizzle connects directly on 5432, which is a different
path, and Supabase Storage for [plan 0002](./0002-product-photos.md) is a
separate service on its own endpoint. The toggle is reversible in
Settings → API if that ever turns out to be wrong.

Automatic RLS stays off because there is then nothing for a policy to protect,
and the API connects as the table owner, which bypasses RLS anyway.

**Leave the GitHub field empty too.** It lets Supabase apply schema changes
from the repository, which would make it a second schema owner alongside
Drizzle ([ADR 0004](../decisions/0004-migrations-over-db-push.md)). Two of
those in one database is the drift this project avoided by keeping Supabase
to the database role.

### Step 1.2 — Copy the session pooler connection string

- [ ] **Action.** Project → **Connect** (top bar), or
      Settings → Database → Connection string. Choose the **Session pooler**
      URI. Replace `[YOUR-PASSWORD]` with the password from step 1.1.

      It looks like:
      `postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

- [ ] **Verify.** The host contains `pooler.supabase.com` and the port is
      **5432**.

**Not the direct connection, and not the transaction pooler.** Three reasons,
all of which fail only in production:

- The direct connection is IPv6-only on the free tier, and Render does not
  give the service an IPv6 route. It will simply refuse to connect.
- The transaction pooler is port **6543** and does not support prepared
  statements. `postgres.js` uses them by default, so queries fail at runtime
  rather than at boot.
- The session pooler is IPv4 and speaks the full protocol.

### Step 1.3 — Migrate and seed

- [ ] **Action.** From the repository root, with the Supabase URI in the
      environment for this command only:

      ```bash
      DATABASE_URL='<session-pooler-uri>' npm --prefix backend run db:migrate
      DATABASE_URL='<session-pooler-uri>' npm --prefix backend run db:seed
      ```

      Do not put this value in `backend/.env` — that file stays pointed at
      local Docker, and a production URI in it is one stray command away from
      wiping real data.

- [ ] **Verify.** Supabase → Table editor shows `users`, `vendors`,
      `products`, `orders`, `order_items`, `municipalities`, `barangays`,
      `sessions`, and `municipalities` holds 8 rows.

### Step 1.4 — Confirm from SQL

- [ ] **Action.** Supabase → SQL editor, run
      `select count(*) from barangays;`
- [ ] **Verify.** Returns 27.

---

## Phase 2 — API (Render)

### Step 2.1 — Create the web service

- [ ] **Action.** Go to **<https://dashboard.render.com/create?type=web>**.
      Connect GitHub and grant access to **`ELITES-ORG/ani`** — the
      repository is private, so Render's GitHub app must be installed on the
      organisation, not just your user.
- [ ] **Verify.** `ELITES-ORG/ani` appears in the repository list and can be
      selected.

### Step 2.2 — Configure the build

- [ ] **Action.** Set:

      | Field | Value |
      |---|---|
      | Name | `ani-api` |
      | Region | Singapore |
      | Branch | `main` |
      | **Root Directory** | `backend` |
      | Runtime | Node |
      | Build Command | `npm ci --include=dev && npm run build` |
      | Start Command | `npm start` |
      | Instance Type | Free |

- [ ] **Verify.** Root Directory reads exactly `backend`. Left blank, the
      build runs at the repository root, finds no `package.json` worth
      building, and fails.

Node version comes from `backend/.node-version`, so there is nothing to set.

**`--include=dev` is load-bearing.** Render applies the service's environment
variables during the build as well as at runtime, and `NODE_ENV=production`
makes npm skip devDependencies — which is where `typescript` and
`@types/node` live. A plain `npm install` therefore fetches 117 packages
instead of 200 and the build dies with:

```
error TS2688: Cannot find type definition file for 'node'.
```

The compiler is a build-time tool, so it has to be a devDependency; the fix
belongs in the install command, not in the dependency list. `npm ci` also uses
the committed lockfile, which makes the build reproducible rather than
resolving ranges afresh on every deploy.

### Step 2.3 — Environment variables

- [ ] **Action.** Under **Environment**, add:

      | Key | Value |
      |---|---|
      | `NODE_ENV` | `production` |
      | `DATABASE_URL` | the session pooler URI from step 1.2 |
      | `SESSION_SECRET` | generate one, below |
      | `CORS_ORIGINS` | `http://localhost:5173` for now — corrected in step 3.4 |

      Generate the secret locally and paste it:

      ```bash
      openssl rand -base64 48
      ```

      Leave every `SUPABASE_*` variable unset. Blank is treated as absent,
      photo upload stays disabled, and everything else works
      ([environment reference](../reference/environment.md)).

- [ ] **Verify.** `SESSION_SECRET` is at least 32 characters. Shorter and the
      API exits at boot with a message naming the field.

### Step 2.4 — Health check

- [ ] **Action.** Under **Health & Alerts**, set Health Check Path to
      `/api/v1/health`.
- [ ] **Verify.** Saved.

### Step 2.5 — Deploy and confirm

- [ ] **Action.** Create the service and watch the log. Note the public URL,
      of the form `https://ani-api.onrender.com`.
- [ ] **Verify.**

      ```bash
      curl -s https://<your-service>.onrender.com/api/v1/health
      ```

      returns `{"data":{"status":"ok","database":"up","uptime":…}}`.

      `"database":"down"` means `DATABASE_URL` is wrong — almost always the
      direct connection instead of the session pooler, or an unreplaced
      `[YOUR-PASSWORD]`.

      Also check the catalogue answers, even though it is empty:

      ```bash
      curl -s https://<your-service>.onrender.com/api/v1/products
      # {"data":[],"meta":{"page":1,"limit":20,"total":0}}
      ```

---

## Phase 3 — Web (Vercel)

### Step 3.1 — Point the rewrite at the real API

- [ ] **Action.** In [`frontend/vercel.json`](../../frontend/vercel.json),
      replace the placeholder host in the `/api/:path*` destination with the
      Render URL from step 2.5. Commit and push.

      ```bash
      git add frontend/vercel.json
      git commit -m "Point the API rewrite at the deployed service"
      git push
      ```

- [ ] **Verify.** `grep onrender frontend/vercel.json` shows your hostname,
      not `ani-api.onrender.com` (unless that is genuinely yours).

This rewrite is what keeps the browser on one origin. Without it the session
cookie is cross-site and sign-in silently fails in production while working
locally.

### Step 3.2 — Import the project

- [ ] **Action.** Go to **<https://vercel.com/new>**, import
      `ELITES-ORG/ani`, granting access to the organisation if prompted.
      Set **Root Directory** to `frontend`. Framework preset should detect
      **Vite**.
- [ ] **Verify.** Root Directory reads `frontend` and the framework is Vite.

### Step 3.3 — Allow files outside the root directory

- [ ] **Action.** Still in Root Directory settings, enable
      **"Include files outside of the Root Directory in the Build Step"**.
- [ ] **Verify.** The checkbox is ticked before the first deploy.

**This one will bite you.** `frontend/tsconfig.app.json` and
`frontend/vite.config.ts` both resolve `@contracts/*` to
`../backend/src/contracts` — one definition of every API shape, shared by both
sides ([ADR 0008](../decisions/0008-one-definition-of-an-api-shape.md)). With
the box unticked, Vercel uploads only `frontend/`, and the build dies with
`Cannot find module '@contracts/products'`. The build works locally, so
nothing warns you first.

If you later see that error, this checkbox is the cause.

### Step 3.4 — Deploy, then close the CORS loop

- [ ] **Action.** Deploy. Note the production URL, of the form
      `https://ani.vercel.app`.

      Then go back to Render → your service → Environment and set
      `CORS_ORIGINS` to that exact URL — scheme, no trailing slash, for
      example `https://ani.vercel.app`. Save; Render redeploys.

- [ ] **Verify.** The deployed site loads and shows "Nothing here yet" rather
      than an error. The network tab shows `/api/v1/products` returning 200
      from the **Vercel** origin, not from `onrender.com`.

Leave `VITE_API_BASE_URL` unset on Vercel. The client defaults to the relative
`/api/v1`, which the rewrite handles. Setting it to the Render URL makes every
request cross-origin and breaks sign-in.

### Step 3.5 — Prove the session works in production

- [ ] **Action.** On the deployed site: register an account, reload the page,
      then register a farm.
- [ ] **Verify.** After reload you are still signed in, and the Sell tab shows
      "Your farm is being reviewed". That dead end is
      [expected](./0003-admin-approval-queue.md).

      If reloading signs you out, the cookie is not sticking: check that
      `CORS_ORIGINS` exactly matches the Vercel URL and that requests are
      going through the Vercel origin.

---

## Phase 4 — Keep awake

### Step 4.1 — Set the health URL

- [ ] **Action.** Go to
      **<https://github.com/ELITES-ORG/ani/settings/variables/actions>** and
      add a repository variable `API_HEALTH_URL` with value
      `https://<your-service>.onrender.com/api/v1/health`.
- [ ] **Verify.** The variable is listed.

### Step 4.2 — Enable the workflow

- [ ] **Action.**

      ```bash
      gh workflow enable "Keep awake" --repo ELITES-ORG/ani
      gh workflow run "Keep awake" --repo ELITES-ORG/ani
      ```

- [ ] **Verify.** `gh run list --repo ELITES-ORG/ani --workflow "Keep awake"`
      shows a successful run.

**Check the Render hours budget before enabling this.** Render grants 750 free
instance hours per *workspace* per month, shared across every free web
service, and exhausting them **suspends all of them until the next month**.

The workspace already runs Bilikha, whose own keep-awake holds it up about 17
hours a day — roughly 510 hours a month. Adding Ani on the same schedule comes
to about 1,020 against a budget of 750, and both would go dark around the
22nd.

So while Ani has no users, leave this phase undone. An idle free service
consumes almost nothing, and cold starts cost nothing when nobody is waiting.
Revisit when Ani has real traffic, at which point one of the two services
should be on a paid instance regardless.

The workflow is also disabled on the GitHub side: on a private repository each
scheduled run bills a minimum of one minute, so pinging nothing every ten
minutes would spend around 100 minutes a day of the Actions allowance.

---

## Acceptance

- [ ] `/api/v1/health` reports `database: up`
- [ ] The Vercel site loads the (empty) catalogue with no console errors
- [ ] Register, reload, still signed in
- [ ] A farm can register and shows as under review
- [ ] Chrome on Android offers "Add to Home Screen"
- [ ] Keep-awake deliberately left off, and the reason understood

## Follow-ups

- The two missing screens, before this link goes to a real farm —
  [plan 0003](./0003-admin-approval-queue.md)
- Custom domain
- Facebook link previews, which need SSR or prerendering. Until then a shared
  product link is a blank card — see the debt section in
  [architecture](../explanation/architecture.md)
- Backups beyond Supabase's free-tier retention
