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

In the tables, **approved** means a session whose account an admin has
approved ([ADR 0020](../decisions/0020-every-account-is-reviewed-before-it-can-order.md)).
A pending or rejected account gets a 403 whose message says which, and what
to do.

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
| `PATCH` | `/me` | session | Correct your details while `pending` or `rejected`. Answers `CurrentUser`. Rate limited |

`CurrentUser` includes `fullName` (derived: first last suffix), `name` parts,
`approval` (`status`: `pending`, `approved` or `rejected`, and `note`, the
admin's reason when rejected, otherwise null), `home` (`municipality`,
`municipalitySlug`, `barangay`, `barangaySlug`, `addressDetail`) or
`home: null` for accounts that predate collecting an address, and `vendor`
(`id`, `farmName`, `status`, and `reviewNote`, the reason when the farm was
rejected). Home address is personal data and appears only here and on the
admin-only `PendingAccount`.

Every signed-in screen loads this once and branches on `vendor`.

`PATCH /me` takes the `register` body without `username` and `password`. An
`email` left out is kept. A `rejected` account goes back to `pending` with
its `note` cleared, and re-enters the admin queue. An approved account gets
409: once approved, details are not edited here.

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
| `POST` | `/products` | approved | Approved vendors only. 403 otherwise |

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
| `POST` | `/vendors/register` | approved | Creates the farm as `pending`. 409 if the account already has one |
| `GET` | `/vendors/mine` | session | The caller's own farm as `OwnFarm`, whatever its status. 404 without one |
| `PATCH` | `/vendors/mine` | approved | Fix the farm while `pending` or `rejected`. Answers `OwnFarm`. Rate limited |

`register` body: `farmName`, `municipalitySlug`, `barangaySlug`, and optional
`description` and `landmark`. A barangay that is not in the given
municipality is a 400.

`OwnFarm` is `VendorDetail` plus `municipalitySlug`, `barangaySlug` and
`reviewNote`. `PATCH /vendors/mine` takes the `register` body. A `rejected`
farm goes back to `pending` with its `reviewNote` cleared, and re-enters the
admin queue. Any other status is a 409.

## Orders

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/orders` | approved | Checkout. One farm per order |
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

## Admin

The approval queue ([ADR 0020](../decisions/0020-every-account-is-reviewed-before-it-can-order.md),
[ADR 0011](../decisions/0011-vendors-are-reviewed-before-listing.md)). Every
route needs an admin session: 401 signed out, 403 for anyone else.

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/admin/accounts` | admin | `PendingAccount[]` with `meta`. Oldest first |
| `PATCH` | `/admin/accounts/:id/review` | admin | `ReviewResult`. Rate limited |
| `GET` | `/admin/farms` | admin | `PendingFarm[]` with `meta`, each with its owner and the owner's `approvalStatus`. Oldest first |
| `PATCH` | `/admin/farms/:id/review` | admin | `ReviewResult`. Rate limited |

Review body: `{ "decision": "approve" }`, or
`{ "decision": "reject", "note": "…" }` where `note` is the reason the person
reads, 3–300 characters after trimming. A reject without one is a 400.

The only moves are `pending → approved` and `pending → rejected`, made by one
conditional update, so of two admins reviewing the same row at once one
succeeds and the other gets a 409. Reviewing a row that is not `pending` is a
409; an unknown id is a 404; reviewing your own account is a 403.

A farm is approved only once its owner's account is: approving a farm whose
owner is `pending` or `rejected` is a 409 saying so, checked inside the same
conditional update. Rejecting such a farm is allowed.

`PendingAccount` carries the applicant's phone, email and home address. It is
personal data, returned to admins only.

New accounts are created `pending`, and cannot order or register a farm
until approved (the **approved** routes above).
