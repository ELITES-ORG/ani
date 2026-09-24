# API reference

Base path `/api/v1`. Every route lives under it.

Response shapes are defined in `backend/src/contracts/` and imported by the
frontend — this page names the routes, the contracts define the fields.

---

## Conventions

**Success**

```jsonc
{ "data": { } }
{ "data": [ ], "meta": { "page": 1, "limit": 20, "total": 134 } }
```

**Error** — one shape, produced by the error handler, never written by hand:

```jsonc
{ "error": { "code": "NOT_FOUND", "message": "…", "details": [] } }
```

| Code | Status | Means |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body, query, or params failed zod. `details` has per-field messages |
| `BAD_REQUEST` | 400 | Valid shape, impossible request |
| `UNAUTHORIZED` | 401 | No session, or it expired |
| `FORBIDDEN` | 403 | Signed in, not allowed |
| `NOT_FOUND` | 404 | No such record, or not yours to see |
| `CONFLICT` | 409 | Collides with existing state — duplicate username, insufficient stock, illegal status move |
| `RATE_LIMITED` | 429 | Too many attempts |
| `INTERNAL_SERVER_ERROR` | 500 | A bug. The message is generic in production |

**Auth** is a session cookie, `ani.sid`, `httpOnly` and `sameSite=lax`. Send
credentials with every request; the frontend client does this by default.

**Pagination** is `page` (from 1) and `limit` (max 50) on every list route.

**Money** is integer centavos throughout. **Quantities** may be fractional.

---

## Health

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/health` | — | `{ status, database, uptime }`. 503 if the database is unreachable |

## Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/auth/register` | — | Creates an account and signs in. Rate limited |
| `POST` | `/auth/login` | — | Rate limited |
| `POST` | `/auth/logout` | — | 204. Destroys the session |
| `GET` | `/auth/me` | session | Same shape as `/me` |

`register` takes `username`, `password` (8+), `firstName`, `lastName`,
`municipalitySlug`, `barangaySlug`, `addressDetail`, `phone`, and optional
`middleName`, `suffix`, and `email`. Username is lowercased; `0917…`,
`+63917…`, and `0917 123 4567` all normalise to `+63917…`. A barangay that is
not in the given municipality is a 400.

## Me

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/me` | session | `CurrentUser`, with `vendor: null` until a farm is registered |

`CurrentUser` includes `fullName` (derived: first last suffix), `name` parts,
`home` (`municipality`, `barangay`, `addressDetail`) or `home: null` for
accounts that predate collecting an address, and `vendor`. Home address is
personal data and appears only here.

Every signed-in screen loads this once and branches on `vendor`.

## Taxonomy

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/taxonomy/municipalities` | — | Eight. Cached with `staleTime: Infinity` |
| `GET` | `/taxonomy/municipalities/:slug/barangays` | — | 404 on an unknown slug |

## Products

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/products` | — | The catalogue. Listed, in stock, approved farms only |
| `GET` | `/products/mine` | session | The caller's own listings, including unlisted and sold out |
| `GET` | `/products/:id` | — | `ProductDetail` including the vendor |
| `POST` | `/products` | session | Approved vendors only. 403 otherwise |

`GET /products` query: `category`, `municipality` (slug), `vendorId`,
`search` (matches name and description), `page`, `limit`.

`POST /products` body: `name`, `description`, `category`, `pricePesos`
(converted to centavos on the way in), `stockAmount`, `unit`, `imageUrls`,
`harvestedAt`.

`/products/mine` is declared before `/:id` so it is not read as an id.

## Vendors

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/vendors` | — | Approved farms. Filter with `municipality` |
| `POST` | `/vendors/register` | session | Creates the farm as `pending`. 409 if the account already has one |

`register` body: `farmName`, `municipalitySlug`, `barangaySlug`, and optional
`description` and `landmark`. A barangay that is not in the given
municipality is a 400.

## Orders

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/orders` | session | Checkout. One farm per order |
| `GET` | `/orders` | session | The caller's own orders |
| `GET` | `/orders/received` | session | The caller's farm's incoming orders. 403 without a farm |
| `GET` | `/orders/:id` | session | Either party only. 404 to anyone else |
| `PATCH` | `/orders/:id/status` | session | See transitions below |

`POST /orders` body: `items` (`productId`, `amount`), `fulfillment`
(`pickup` or `delivery`), optional `deliveryMunicipalitySlug`,
`deliveryBarangaySlug`, `deliveryLandmark`, `notes`. Delivery requires a
barangay and municipality.

Checkout runs in one transaction with the product rows locked, so two buyers
cannot both take the last kilo. Insufficient stock is a 409 naming what is
left. Items from more than one farm are a 400 — split the basket first
([ADR 0009](../decisions/0009-an-order-belongs-to-one-farm.md)).

**Status transitions**

| From | May become |
|---|---|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `ready`, `cancelled` |
| `ready` | `out_for_delivery`, `completed`, `cancelled` |
| `out_for_delivery` | `completed`, `cancelled` |
| `completed` | — |
| `cancelled` | — |

The farm drives fulfilment. The buyer may only cancel. Anything else is a 409
naming both states. Cancelling returns the reserved stock to the catalogue.
