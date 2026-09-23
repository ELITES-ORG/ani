# 0006. Username and password auth, with server-side sessions

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani needs accounts for ordering and selling. Browsing stays anonymous.

The options were a hosted identity provider (Supabase Auth, Auth0), one-time
codes by SMS, social sign-in, or username and password held here. The people
signing up are on prepaid Android handsets; a meaningful share do not have an
email address they check.

## Decision

Username and password, hashed with Argon2id, with server-side sessions stored
in Postgres and delivered as an `httpOnly`, `sameSite=lax` cookie.

Mobile number is collected and normalised to `+63` form at registration, but
is not the login credential.

## Alternatives considered

**Supabase Auth.** Rejected with [ADR 0005](./0005-supabase-is-the-database-not-the-backend.md):
adopting it means adopting its session model and a second user table.

**SMS one-time codes.** The most natural fit for the audience, and it costs
money per message with no free tier worth the name. Worth revisiting when
there is a budget; the phone number is already collected and normalised so
that this is a small change rather than a migration.

**Email magic links.** Assumes an email address people actually read. Many do
not.

**JWTs in `localStorage`.** Cannot be revoked before expiry, and readable by
any script that gets onto the page. A session row can be deleted.

## Consequences

**Easier.** Signing out actually signs out, everywhere. Suspending an account
takes effect on the next request rather than whenever a token happens to
expire, because `requireAuth` re-reads the user each time. No third-party
identity service to depend on or pay for.

**Harder.** We own password reset, which does not exist yet and needs a
channel — that is the same SMS problem, deferred. Cookies mean the frontend
must be same-origin with the API in production, which the Vercel rewrite
handles, and `withCredentials` must stay on in the client.

Sessions in Postgres rather than Redis costs one query per authenticated
request and saves running a second datastore. At this volume that is the
right side of the trade.
