# 0004. Generated migrations over `db:push`

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Drizzle Kit offers two ways to get schema changes into a database: `push`,
which diffs the schema against the database and applies the difference
directly, and `generate`, which writes a SQL migration file to be committed
and applied in order.

`push` is faster while iterating alone.

## Decision

Use `drizzle-kit generate`, commit the SQL, and apply with `drizzle-kit
migrate`. `db:push` is not in the scripts.

## Alternatives considered

**`db:push` in development, migrations for production.** The usual compromise,
and it produces a first migration that has never been run against anything —
the local database got there by a series of pushes the migration does not
describe. The first production deploy is then the first real test of it.

## Consequences

Schema history is in the repository and reviewable in the pull request that
changes it. Every environment reaches the same schema by the same path, and
the local database is a genuine rehearsal for production.

The cost is a generate step on every schema change, and occasionally editing
generated SQL by hand when a rename would otherwise be emitted as a drop and
an add.
