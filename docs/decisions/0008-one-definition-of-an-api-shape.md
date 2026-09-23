# 0008. One definition of an API shape, imported by both sides

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

The API returns JSON and the frontend consumes it. Without something binding
them, each side declares its own interface for the same payload and the two
drift — usually discovered when a field is renamed on one side and the other
keeps compiling.

## Decision

Response shapes are declared once in `backend/src/contracts/` and imported by
both sides. The frontend reaches them through the `@contracts/*` path alias.

Three rules, enforced by review:

1. **No imports**, except a type-only import of a sibling contract. That form
   typechecks under both the backend's `NodeNext` resolution and the
   frontend's `bundler`.
2. **No runtime code.** No constants, no helpers, no zod, no enums that emit
   JavaScript. If it compiles to JS it does not belong here.
3. **No Drizzle types.** A shape that needs one is describing a table, not a
   response.

The service annotates its return type with the contract. **That annotation is
the mechanism** — `res.json()` accepts `any`, so an unannotated object literal
is checked against nothing.

## Alternatives considered

**A shared package.** A third `package.json`, a build step, and a version to
keep in step, to share a handful of interfaces inside one repository.

**Generating types from OpenAPI.** Worth it with several consumers or an
external API. Here it adds a spec to maintain and a generation step to forget.

**Duplicating the types.** What happens by default, and the thing this exists
to prevent.

## Consequences

**Easier.** Renaming a response field breaks the frontend build in the same
pull request that renamed it, which is exactly when it should break.

**Harder.** The frontend's `tsconfig` reaches outside its own directory, which
is unusual and occasionally surprises tooling. Keeping the contracts free of
runtime code takes discipline — the temptation to put a status-label map next
to the status union is constant. Those belong in the consuming feature's
`types.ts`.
