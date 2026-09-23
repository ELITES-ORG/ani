# 0003. Modular monolith with feature slices

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

The API needs a structure that a single contributor can hold in their head and
that keeps unrelated features from tangling. The two obvious candidates are
layered architecture — controllers, services, repositories, entities as
top-level folders — and feature modules.

## Decision

Group the backend by feature under `src/modules/<name>/`, each owning its
router, validation, and data access:

```
modules/products/
├── products.routes.ts    route definitions
├── products.schema.ts    zod request schemas
└── products.service.ts   data access and logic
```

Cross-cutting pieces live in `config/`, `lib/`, `db/`, `middleware/`, and
`contracts/`. `routes/index.ts` is the only place modules are mounted.

A module does not import another module's internals. Shared behaviour moves to
`lib/` or the database layer; two modules reaching into one another is the
signal that a third thing wants to exist.

## Alternatives considered

**Layered / clean architecture** — `domain/`, `application/`, `infrastructure/`,
`presentation/` as top-level rings, with repository interfaces in the domain
and implementations outside. It buys a database that can be swapped without
touching business logic, and use cases testable with in-memory fakes.

It loses here on cost per change. Adding one field to a product touches an
entity, a repository port, an implementation, a mapper, a DTO, and a use case
— six files across four layers, for a change that is genuinely about one
thing. The indirection pays off when there are several delivery mechanisms or
several data sources; Ani has one API and one Postgres.

**A single `routes/` folder with everything flat.** Fine at five endpoints,
unreadable at thirty, and nothing signals where a new file belongs.

## Consequences

**Easier.** A feature is one folder. Adding an endpoint means creating or
editing files in one place, and deleting a feature means deleting a directory.
Onboarding is "read `modules/products/` and copy its shape".

**Harder.** Nothing enforces the no-cross-imports rule but review. Swapping
the database means touching every service, since Drizzle calls sit directly in
them — accepted deliberately, because that swap is not planned and the layered
alternative charges for the option on every unrelated change.
