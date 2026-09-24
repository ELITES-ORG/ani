# Change the database schema

Schema lives in `backend/src/db/schema/`, one file per subject area, all
re-exported from `index.ts`. Changes become committed SQL migrations — never
pushed straight at a database. See
[ADR 0004](../decisions/0004-migrations-over-db-push.md).

---

## 1. Edit the schema

```ts
// backend/src/db/schema/products.ts
export const products = pgTable('products', {
  // …
  // Numeric, not integer: produce sells in fractional kilos.
  stockAmount: numeric('stock_amount', { precision: 12, scale: 3, mode: 'number' })
    .notNull()
    .default(0),
});
```

Conventions that are not optional:

- **Money is `integer` centavos**, and the column name says so:
  `price_centavos`. See [ADR 0010](../decisions/0010-money-is-integer-centavos.md).
- **Quantities are `numeric(12,3)` with `mode: 'number'`.** Without the mode,
  Drizzle hands you a string and arithmetic silently concatenates.
- **Timestamps are `withTimezone: true`.** The server runs in UTC and the
  users are in PHT.
- **Enums are `pgEnum`**, declared in `enums.ts` and shared.
- **Indexes are declared in the table's second argument**, and named after
  what they serve.

## 1a. Decide whether this is one release or two

Merging to `main` auto-deploys the API, and Render's pre-deploy command is a
paid feature, so **the database and the code never change at the same
instant**. For some window — a minute or two — one of them is ahead of the
other. Every schema change has to be safe in that window.

| The change | Releases | Order |
|---|---|---|
| Add a table, or a **nullable** column | One | Migrate, then merge |
| Add a `NOT NULL` column | Two | Add it nullable (release 1); backfill and tighten (release 2) |
| Drop or rename a column the code reads | Two | Stop reading it (release 1); drop it (release 2) |
| Make an existing column `NOT NULL` | Two | Start writing it everywhere (release 1); tighten (release 2) |

**Expand, then contract.** Release 1 only *adds* and *loosens*, and the new
code must work against the database both before and after that migration —
while the old code, still deployed, must keep working against it too. Migrate,
then merge. Release 2 *removes* and *tightens*, once nothing deployed reads the
old shape. The order flips: **merge, wait for Render to show Live, then
migrate.**

A migration that drops a column the running code selects takes that endpoint
down until the new code is live. [Plan 0006](../plans/0006-registration-collects-name-and-home.md)
nearly shipped exactly that — dropping `full_name` returned `500` on sign-in in
rehearsal — and was split into two releases as a result.

**Rehearse it.** Before the first release, check out `main`, migrate a fresh
database, create a few rows through the real API, apply your migration, and
confirm the *old* code still works. That test is the whole point: a fresh
`db:reset` only proves the end state, never the window.

## 2. Generate the migration

```bash
npm run db:generate
```

Read the generated SQL before committing it. Drizzle infers a rename it cannot
see as a drop plus an add, which silently discards a column of data. If that
is what it produced, edit the file by hand into an `ALTER TABLE … RENAME`.

## 3. Apply it

```bash
npm run db:migrate
```

To start over locally:

```bash
npm run db:reset && npm run db:migrate && npm run db:seed
```

## 4. Update the contract, if the change is visible

A new column is not automatically part of any response. If it should be, add
it to the relevant file in `backend/src/contracts/` and to the service that
builds the shape. The contract holds **no Drizzle types** — a shape that needs
one is describing a table, not a response.

## 5. Update the reference

Add the change to [`docs/reference/data-model.md`](../reference/data-model.md)
in the same pull request.

---

## Checklist

- [ ] One release or two decided (§1a); if two, this PR only adds and loosens
- [ ] Old code rehearsed against the migrated database, not just a fresh reset
- [ ] Money in integer centavos, named `*_centavos`
- [ ] Quantities `numeric` with `mode: 'number'`
- [ ] Timestamps `withTimezone: true`
- [ ] Generated SQL read, and any rename fixed by hand
- [ ] Migration applied locally against a reset database
- [ ] Seed still runs
- [ ] Contract and `data-model.md` updated
