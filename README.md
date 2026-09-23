# Ani

Farm to table in Biliran province. Ani connects households and kitchens
directly with the farms and fisherfolk around them — no middleman, no trip to
the palengke to find out what is in season.

Two things it does:

1. **Customers browse and order produce** from farms near them.
2. **Customers register as vendors** and sell their own harvest.

`ani` is Filipino for *harvest*.

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS 4, installable as a PWA |
| API | Express 5 + TypeScript, Drizzle ORM |
| Database | PostgreSQL 17 (Supabase in production) |
| Data fetching | TanStack Query + Axios |
| Hosting | Vercel (web), Render (API), Supabase (Postgres and image storage) |

It is a **PWA rather than a native app** on purpose: in a province of 180,000
people, install friction costs more than native capability buys.
See [ADR 0002](./docs/decisions/0002-a-pwa-not-a-native-app.md).

---

## Getting started

```bash
npm run setup      # env files, git hooks, both workspaces
npm run db:up      # Postgres in Docker, on port 5433
npm run db:migrate
npm run db:seed    # eight municipalities and their barangays
```

Then, in two terminals:

```bash
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Full walkthrough: [`docs/getting-started/local-setup.md`](./docs/getting-started/local-setup.md).

---

## Layout

```
ani/
├── backend/     Express API — modules, Drizzle schema, migrations
├── frontend/    React PWA — features, pages, design tokens
├── docs/        Developer documentation (start at docs/README.md)
├── scripts/     Repository tooling
└── CLAUDE.md    Standing rules for contributors and AI agents
```

The two services deploy independently and are versioned together. One pull
request can change an endpoint and its consumer, and there is no package to
publish between them.

---

## Documentation

Start at [`docs/README.md`](./docs/README.md). It is split by purpose:
getting started, guides, reference, explanation, decisions, and plans.

Two worth reading before any structural change:

- [Operating constraints](./docs/explanation/constraints.md) — why several
  decisions that look wrong are correct here
- [Architecture](./docs/explanation/architecture.md) — how the pieces fit

---

## Commands

| Command | Does |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Run a service in watch mode |
| `npm run typecheck` | Typecheck both workspaces |
| `npm run lint` | oxlint both workspaces |
| `npm test` | Run both test suites |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:reset` | Drop the local database and start clean |
| `npm run docs:check` | Verify documentation links and plan statuses |

Full list: [`docs/reference/commands.md`](./docs/reference/commands.md).
