# API contracts

Response shapes shared by the backend and the frontend. Declared once so the
two sides cannot drift apart in authorship
([ADR 0008](../../../docs/decisions/0008-one-definition-of-an-api-shape.md)).

## Rules

1. **No imports, except a type-only import of a sibling contract.**
   `import type { VendorSummary } from './vendors.js'` is allowed and
   typechecks under both resolution modes — the backend's `NodeNext` (which
   needs the `.js`) and the frontend's `bundler`.

   Nothing else. Not Drizzle, not a helper, not a schema.

2. **No runtime code.** No constants, no helpers, no functions, no enums that
   emit JavaScript, no zod. If it compiles to JS it does not belong here.

3. **No Drizzle types, ever.** A shape that needs one is describing a table,
   not a response.

The service annotates its return type with the contract. That annotation is
the whole mechanism — a function that happens to return the right shape proves
nothing.

## Paginated lists

A list route answers `{ data, meta }`. Use `Paginated<T>` from
`pagination.ts`, and annotate the meta the route builds:

```ts
const meta: ListMeta = { page: query.page, limit: query.limit, total };
res.json({ data, meta });
```

`res.json()` takes `any`, so an unannotated object literal is checked against
nothing.
