# 0004. Offline catalogue

- **Status:** Draft
- **Owner:** unassigned
- **Related:** [ADR 0012](../decisions/0012-the-service-worker-caches-nothing-yet.md),
  [constraints §2](../explanation/constraints.md)

## Goal

Someone who opens Ani with no signal sees the produce they browsed last time,
instead of a blank page — without any risk of being pinned to a stale build.

**Read [ADR 0012](../decisions/0012-the-service-worker-caches-nothing-yet.md)
before starting.** The current worker is inert on purpose. This plan is the
deliberate path to changing that; editing `sw.js` without it is the failure
the ADR describes.

## Scope

**In scope**

- Versioned precache of the app shell, keyed to the build
- Stale-while-revalidate for `GET /api/v1/products`
- Cache-first for product images, which are immutable once uploaded
- An in-app notice when a new build is available, and a path to it

**Out of scope**

- Offline *writes*. Placing an order offline means reserving stock that may
  not exist. Queued mutations are a separate problem and a separate plan
- Background sync

## Prerequisites

- [Plan 0001](./0001-deployment.md) complete, so there is a real deploy to
  test updates against
- A build identifier emitted into the bundle and written beside it

## Blockers

None, but this should not start until the product has real users. Its whole
value is measured against real connections, and its whole risk is borne by
real phones.

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Update path first | 0 / 2 | Not started |
| 2. Caching | 0 / 3 | Not started |

---

## Phase 1 — Build the update path before the cache

### Step 1.1 — Build identifier

- [ ] **Action.** Emit a `build-id.txt` beside `index.html` and bake the same
      value into the bundle. It must not live under `/assets/`, which is
      immutable for a year.
- [ ] **Verify.** Two consecutive deploys produce different values, and
      fetching `/build-id.txt` with `no-store` returns the current one.

### Step 1.2 — Notice a new build

- [ ] **Action.** Compare the baked-in identifier against the file, at most
      hourly, and show a dismissible "New version available — reload" bar.
- [ ] **Verify.** With the app open, deploy; the bar appears within the
      interval and reloading lands on the new build.

Doing this first means that when a cache goes wrong there is already a working
way to get people off it.

---

## Phase 2 — Caching

### Step 2.1 — Versioned precache

- [ ] **Action.** Precache the shell under a cache name containing the build
      identifier. On `activate`, delete every cache whose name does not match.
- [ ] **Verify.** After a deploy, Cache Storage holds exactly one shell cache,
      named for the new build.

### Step 2.2 — Catalogue reads

- [ ] **Action.** Stale-while-revalidate for `GET /api/v1/products` only.
      Never cache an authenticated response — orders and `/me` must not be
      readable from a shared device after sign-out.
- [ ] **Verify.** Offline, Browse renders the last-seen produce. `/api/v1/me`
      offline fails rather than returning a cached identity.

### Step 2.3 — Images

- [ ] **Action.** Cache-first for storage objects, capped at roughly 200
      entries with a 30-day expiry.
- [ ] **Verify.** A revisited product shows its image with the network
      disabled, and the cache does not grow without bound.

---

## Acceptance

- [ ] Airplane mode on a revisited device shows the catalogue
- [ ] No authenticated response is ever served from a cache
- [ ] A deploy is picked up within an hour on an open tab
- [ ] `/sw-enabled` set to `off` still removes everything

## Follow-ups

- Queued offline ordering, if buyers actually ask for it
- Letting a vendor draft a listing offline
