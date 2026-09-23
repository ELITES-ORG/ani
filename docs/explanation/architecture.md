# Architecture

Why the system is shaped this way. For *how to change it*, see the
[guides](../guides/); for exact names and values, see the
[reference](../reference/).

---

## Two services, one repository

```
          browser
             │
   ┌─────────┴──────────┐
   │  React SPA (Vite)  │   :5173 dev
   └─────────┬──────────┘
             │  /api/v1  (Vite proxies in dev; Vercel rewrites in prod)
   ┌─────────┴──────────┐
   │  Express 5 API     │   :4000
   └─────────┬──────────┘
             │  Drizzle
   ┌─────────┴──────────┐
   │  PostgreSQL 17     │   :5433 dev, Supabase in prod
   └────────────────────┘
```

They deploy and scale independently but are versioned together. At this size a
monorepo with two `package.json` files beats either a single bundled service or
separate repositories: one pull request can change an endpoint and its
consumer, and there is no package to publish between them.

The frontend never talks to Postgres. The backend serves no HTML.

---

## Supabase is the database, not the backend

Ani uses Supabase for managed Postgres and, later, image storage. It does not
use Supabase Auth, row-level security, or the auto-generated PostgREST API.

This is deliberate and the two approaches do not mix. Supabase's model is
browser → PostgREST → Postgres with RLS enforcing permissions from a JWT. Ani's
model is browser → Express → Postgres with the rules in service code. Running
both means two doors to the same tables, two schema owners, and two user
tables. Picking one and using it properly is cheaper than half of each.

What that buys: business rules live in one place that is testable without a
browser, and the database can move to Neon, Render, or a plain VPS by changing
one connection string. ([ADR 0005](../decisions/0005-supabase-is-the-database-not-the-backend.md))

---

## Request lifecycle

A request to `GET /api/v1/products`:

1. **`app.ts` middleware**, in order — `helmet`, `cors` (origin allowlist),
   `compression`, JSON body parsing, `express-session`, `pino-http`
2. **`routes/index.ts`** matches the `/products` prefix
3. **`modules/products/products.routes.ts`** parses input with zod and calls
   the service
4. **`products.service.ts`** issues SQL through Drizzle and returns a shape
   annotated with a contract type
5. **Response** wrapped in `{ data }`, or `{ data, meta }` for a list
6. **No match, or a throw** → `notFoundHandler` / `errorHandler`, producing the
   single `{ error: { code, message, details } }` shape

Express 5 forwards rejected promises from `async` handlers to the error handler
by itself, so there is no `asyncHandler` wrapper anywhere. Do not add one.

---

## Backend layering

```
src/
├── config/     environment, validated once at boot
├── contracts/  response shapes shared with the frontend
├── db/         client, schema, seed
├── lib/        logger, AppError, money, password, session store
├── middleware/ cross-cutting request handling
├── modules/    features — router, validation, service
└── routes/     composition; the only place modules are mounted
```

A module owns its router, its validation, and its data access. It does not
reach into another module's internals — shared behaviour moves to `lib/` or the
database layer. Two modules reaching into one another is the signal that a
third thing wants to exist. ([ADR 0003](../decisions/0003-modular-monolith-with-feature-slices.md))

**Environment is validated at boot, not at use.** `config/env.ts` parses
`process.env` with zod and exits on failure. A bad `DATABASE_URL` crashes at
startup with a message naming the field, rather than surfacing as a confusing
error inside a handler an hour later. Optional variables treat a blank string
as absent, because a field someone cleared in a dashboard arrives as `""`.

**Errors are thrown, never hand-written.** `AppError` carries a status and a
code; everything else reaching the handler is treated as a bug, logged at error
level, and reported as a generic 500.

**Money never touches a float.** Prices are integer centavos end to end.
([ADR 0010](../decisions/0010-money-is-integer-centavos.md))

**Checkout holds a real transaction.** Reserving stock and writing the order
happen together, with the product rows locked `FOR UPDATE` so two buyers cannot
both pass the stock check on the last kilo of a harvest. This is a concrete
reason the API owns database access rather than the browser.

---

## Frontend layering

```
src/
├── components/ui/   primitives with no domain knowledge
├── components/      composed, app-aware pieces
├── features/<name>/ types + query hooks per feature
├── hooks/           cross-feature React state
├── lib/             api client, query client, cart, money, cn
├── pages/           route composition only
└── styles/          tokens, base
```

**Server state is TanStack Query's, not React's.** Anything fetched lives in
the query cache under that feature's key factory. Copying fetched data into
`useState` creates a second source of truth that goes stale.

**Stale times are long on purpose.** Reference data is `Infinity`; the default
is five minutes. Most users are on metered mobile data — see
[constraints](./constraints.md).

**All errors normalise through `toApiError`**, so a component renders
`error.message` without knowing whether the failure was a timeout, an offline
device, or a 500.

**Styling is tokens only.** No raw hex, no one-off shadows, no arbitrary font
sizes. See [`frontend/DESIGN.md`](../../frontend/DESIGN.md).

---

## One definition of an API shape

`backend/src/contracts/` holds the response types, and the frontend imports
them through the `@contracts/*` alias. The service annotates its return type
with the contract; that annotation is the whole mechanism, because `res.json()`
takes `any` and an unannotated object literal is checked against nothing.

Contracts contain types only — no runtime code, no zod, no Drizzle types. A
shape that needs a Drizzle type is describing a table, not a response.
([ADR 0008](../decisions/0008-one-definition-of-an-api-shape.md))

---

## The known architectural debt

The SPA is client-rendered, which conflicts with the product's main discovery
mechanism: a product link shared on Facebook or Messenger. **Facebook's scraper
does not execute JavaScript**, so a shared product link currently renders as a
blank card.

`index.html` carries static Open Graph tags as a stopgap. That does not solve
per-product tags.

Before any real push for adoption this needs one of:

1. An SSR or prerender layer in front of the public routes
2. A crawler-facing cache serving rendered HTML
3. Moving the public catalogue to a framework with SSR

The split that makes this tractable already exists: **browse and product pages**
are anonymous and share-critical; **cart, orders, and the sell area** are
signed-in and have no sharing value. Only the first needs solving.

---

## What is deliberately absent

| Not here | Why |
|---|---|
| PostGIS | Eight municipalities. A lookup table answers every location question this product has |
| Elasticsearch | Hundreds of listings. `ILIKE` covers it, and Postgres full-text is the next step if it does not |
| Redis | Sessions live in Postgres. One fewer service to run and one fewer free tier to outgrow |
| GraphQL | A handful of read-heavy endpoints with predictable shapes |
| A payments integration | Pickup and cash on delivery are how this trade already works. Adding GCash is a decision with its own consequences, not a default |
| Push notifications | Judged not critical for MVP. Vendors check the app; volume is low enough that this is honest |
| Microservices | One product, one team, one deployable pair |

Each is a real option later. None is justified by current load, and every one
adds an operational component someone has to run.
