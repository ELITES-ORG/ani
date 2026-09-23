# 0005. Supabase is the database, not the backend

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani needs a managed Postgres on a free tier, and Supabase was chosen for it.
Supabase is not only a database, though: it also ships authentication, file
storage, row-level security, and an auto-generated REST API over the same
tables. Using all of it would mean the browser talks to Postgres directly and
the business rules live in SQL policies.

Separately, Render's free Postgres expires 30 days after creation, so the
database could not live beside the API there regardless.

## Decision

Supabase provides **managed Postgres** — a `DATABASE_URL` — and, later, object
storage for product photos. Nothing else.

Everything goes through the Express API using Drizzle. No Supabase client in
the browser, no Supabase Auth, no row-level security, no PostgREST.

## Alternatives considered

**Use Supabase properly: PostgREST, Auth, and RLS.** Less code to write, and
row-level security is a genuinely good way to express "a vendor may only edit
their own products". It loses because the two models actively fight:

- RLS operates on JWT claims through PostgREST. A server connecting as an
  ordinary role either gets blocked by the policies or is granted `BYPASSRLS`,
  at which point RLS protects nothing. There is no middle setting.
- Supabase's migration tooling and dashboard edits expect to own the schema;
  Drizzle generates and applies its own. Two schema owners in one database
  means drift.
- Supabase Auth and a server session store each want their own user table.

**A Dart backend (Serverpod) with Supabase underneath.** Considered seriously
while the client was going to be Flutter, and dropped with that decision — see
[ADR 0002](./0002-a-pwa-not-a-native-app.md).

**Render Postgres.** Free tier deletes the database 30 days after creation,
with a 14-day grace period. Not a database, a countdown.

## Consequences

**Easier.** Business rules live in TypeScript, in services, testable without a
browser or a JWT. Checkout can hold a real transaction with `SELECT … FOR
UPDATE`, so two buyers cannot both pass the stock check on the last kilo of a
harvest — something the Supabase JS client cannot express, because PostgREST
wraps each HTTP call in its own transaction. Moving to Neon, Render, or a
plain VPS is a connection-string change.

**Harder.** We write the authorisation checks that RLS would have given us,
and a mistake in a service is a data leak with no second line of defence. That
tradeoff is accepted knowingly: the checks are concentrated in service
functions like `getOrderForUser`, not scattered through routes.

**What we are leaving on the table.** Realtime subscriptions, and the instant
CRUD API. Neither is needed; if realtime order updates are wanted later,
polling on a 30-second stale time is already adequate at this volume.
