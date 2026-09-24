# Decision records

Short records of decisions with consequences, and the reasoning behind them.

They exist so nobody re-litigates a settled question from scratch — and so
that when a decision *should* be revisited, the reasoning that produced it is
visible rather than guessed at.

---

## Status

| Status | Means |
|---|---|
| **Accepted** | Decided and reflected in the code today |
| **Proposed** | Decided in principle, not yet built. Still open to change |
| **Superseded** | Replaced. Links to what replaced it. **Never deleted** |

A superseded record keeps its reasoning. "We tried X and moved to Y because Z"
is more valuable than a record that only shows Y.

---

## Writing one

Copy `_template.md`. Keep it under a page.

Write a record when a choice would be expensive to reverse, when you rejected
a reasonable alternative, or when the decision will look wrong to someone
without the context. Do not write one for choices with an obvious default.

Number sequentially. Never renumber.

---

## Log

| # | Decision | Status |
|---|---|---|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](./0002-a-pwa-not-a-native-app.md) | A PWA, not a native app | Accepted |
| [0003](./0003-modular-monolith-with-feature-slices.md) | Modular monolith with feature slices | Accepted |
| [0004](./0004-migrations-over-db-push.md) | Generated migrations over `db:push` | Accepted |
| [0005](./0005-supabase-is-the-database-not-the-backend.md) | Supabase is the database, not the backend | Accepted |
| [0006](./0006-username-password-auth-with-server-sessions.md) | Username and password auth with server sessions | Accepted |
| [0007](./0007-one-account-selling-is-a-role.md) | One account; selling is a role you add | Accepted |
| [0008](./0008-one-definition-of-an-api-shape.md) | One definition of an API shape | Accepted |
| [0009](./0009-an-order-belongs-to-one-farm.md) | An order belongs to one farm | Accepted |
| [0010](./0010-money-is-integer-centavos.md) | Money is integer centavos | Accepted |
| [0011](./0011-vendors-are-reviewed-before-listing.md) | Vendors are reviewed before listing | Accepted |
| [0012](./0012-the-service-worker-caches-nothing-yet.md) | The service worker caches nothing yet | Accepted |
| [0013](./0013-bottom-navigation-on-phones.md) | Bottom navigation on phones | Accepted |
| [0014](./0014-ai-attribution-is-blocked-by-a-check.md) | AI attribution is blocked by a check, not by a rule | Accepted |
| [0015](./0015-dark-ink-on-the-brand-green.md) | Dark ink on the brand green | Accepted |
| [0016](./0016-the-interface-assumes-no-app-literacy.md) | The interface assumes no app literacy | Accepted |
| [0017](./0017-motion-is-css-only.md) | Motion is a few keyframes, and never load-bearing | Accepted |
| [0018](./0018-one-self-hosted-variable-font.md) | One self-hosted variable font | Accepted |
| [0019](./0019-page-changes-are-view-transitions.md) | Page changes are view transitions | Accepted |
