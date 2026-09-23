# Commands

Run from the repository root unless stated otherwise. The root scripts
delegate with `npm --prefix`, so there is no workspace linking to think about.

---

## Setup

| Command | Does |
|---|---|
| `npm run setup` | Env files, git hooks, and both workspaces' dependencies |
| `npm run setup:env` | Copy `.env.example` to `.env` where one is missing. Never overwrites |
| `npm run hooks:install` | Point `core.hooksPath` at `.githooks/` |

## Database

| Command | Does |
|---|---|
| `npm run db:up` | Start Postgres in Docker on port 5433 |
| `npm run db:down` | Stop it, keeping data |
| `npm run db:reset` | **Destroys the volume** and starts clean |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed municipalities and barangays. Idempotent |

After `db:reset`, run `db:migrate` and `db:seed` again.

## Development

| Command | Does |
|---|---|
| `npm run dev:api` | API on :4000, watch mode |
| `npm run dev:web` | PWA on :5173, proxying `/api` to :4000 |

Two terminals. Use the Vite server, not the API port directly — sessions
depend on the browser staying same-origin.

## Verification

| Command | Does |
|---|---|
| `npm run typecheck` | Both workspaces |
| `npm run lint` | oxlint, both workspaces |
| `npm test` | Both test suites |
| `npm run build` | Production build of both |
| `npm run docs:check` | Documentation links and plan statuses |
| `npm run check:commits` | AI attribution check over `origin/main..HEAD` |

Run the first four before reporting work done.

## Backend-only

From `backend/`:

| Command | Does |
|---|---|
| `npm run db:studio` | Drizzle Studio against the local database |
| `npm run test:watch` | Vitest in watch mode |

---

## Things that are not commands

**Approving a vendor** is a SQL update until
[plan 0003](../plans/0003-admin-approval-queue.md) ships:

```bash
docker exec ani-postgres psql -U ani -d ani \
  -c "update vendors set status='approved' where farm_name='…';"
```

**Making yourself an admin:**

```bash
docker exec ani-postgres psql -U ani -d ani \
  -c "update users set is_admin=true where username='…';"
```
