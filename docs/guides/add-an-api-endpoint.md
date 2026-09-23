# Add an API endpoint

The backend groups routes by feature under `src/modules/`. A module owns its
router, its validation, and its data access; it does not reach into another
module's internals.

---

## 1. Create or find the module

```
backend/src/modules/<feature>/
├── <feature>.routes.ts    route definitions
├── <feature>.schema.ts    zod request schemas
└── <feature>.service.ts   data access and logic
```

Start with just `.routes.ts`. Split out a service when the router stops being
readable — not before.

## 2. Write the router

```ts
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { listQuery } from './products.schema.js';
import { getProduct, listProducts } from './products.service.js';

export const productsRouter: Router = Router();

const idParam = z.object({ id: z.string().uuid() });

productsRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await getProduct(id) });
});
```

Four things to copy from this:

- **Relative imports end in `.js`.** The build is ESM with `NodeNext`.
  TypeScript resolves `./foo.js` to `foo.ts` at compile time and the emitted
  import is correct at runtime. Omitting it compiles cleanly and fails at
  runtime.
- **`async` handlers need no wrapper.** Express 5 forwards rejected promises
  to the error handler by itself. Do not add an `asyncHandler`.
- **Throw, do not hand-write error responses.** `AppError` renders through the
  central handler so every error has one shape.
- **Order matters.** A literal path such as `/mine` must be declared before
  `/:id`, or it is parsed as an id.

## 3. Mount it

In `backend/src/routes/index.ts`:

```ts
apiRouter.use('/products', productsRouter);
```

Everything hangs off `/api/v1`, so this serves at `/api/v1/products/:id`.

## 4. Validate input

Anything from the client — body, query, or params — is parsed with zod before
use. A `ZodError` reaching the error handler is rendered as a 400 with
per-field messages, so you do not need to catch it.

```ts
export const listQuery = z.object({
  municipality: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
```

**Always cap `limit`.** An uncapped page size is a denial-of-service vector
and an accidental full-table scan.

## 5. Authorise in the service, not the route

A route should not need a second query to decide whether the caller may see
something. Put the rule where the data is:

```ts
export async function getOrderForUser(userId: string, orderId: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) throw AppError.notFound(`No order with id "${orderId}"`);
  // …checks, then return
}
```

For something private, prefer `notFound` over `forbidden`: confirming a record
exists tells a stranger something about someone else's business.

## 6. Response shape

Non-negotiable, because the frontend client unwraps it generically:

```jsonc
// success
{ "data": { } }
{ "data": [ ], "meta": { "page": 1, "limit": 20, "total": 134 } }

// error — produced by the error handler, never by hand
{ "error": { "code": "NOT_FOUND", "message": "…", "details": [] } }
```

Annotate the service's return type with a contract from `src/contracts/`.
`res.json()` takes `any`, so an unannotated object literal is checked against
nothing. See [ADR 0008](../decisions/0008-one-definition-of-an-api-shape.md).

## 7. Mirror it on the frontend

Add types and a query hook under `frontend/src/features/<feature>/`. Follow
`features/products/` — a `types.ts` re-exporting the contract, and an `api.ts`
with a key factory, fetchers wrapping errors in `toApiError`, and hooks.

## 8. Update the reference

Add the endpoint to [`docs/reference/api.md`](../reference/api.md) in the same
pull request. It is the only place the API surface is written down.

---

## Checklist

- [ ] Relative imports end in `.js`
- [ ] No `asyncHandler`
- [ ] Input parsed with zod; `limit` capped on any list endpoint
- [ ] Literal paths declared before `/:id`
- [ ] Errors thrown as `AppError`, never hand-rolled JSON
- [ ] Authorisation lives in the service
- [ ] Response wrapped in `data`, return type annotated with a contract
- [ ] Mounted under `/api/v1`
- [ ] Frontend types and hook added
- [ ] `docs/reference/api.md` updated
