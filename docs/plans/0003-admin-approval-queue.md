# 0003. Admin approval queue

- **Status:** Ready
- **Owner:** unassigned
- **Related:** [ADR 0011](../decisions/0011-vendors-are-reviewed-before-listing.md)

## Goal

An admin can see farms awaiting review and approve or reject them from the
app, instead of running a SQL update by hand.

## Scope

**In scope**

- `GET /api/v1/admin/vendors?status=pending`
- `PATCH /api/v1/admin/vendors/:id/status`
- An admin-only screen listing pending farms with approve and reject actions

**Out of scope**

- Notifying the farm that it was approved — there is no channel yet
- Moderating individual products

## Prerequisites

- At least one user with `is_admin = true`
- `requireAdmin` middleware exists in `backend/src/middleware/require-auth.ts`

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. API | 0 / 2 | Not started |
| 2. Screen | 0 / 2 | Not started |

---

## Phase 1 — API

### Step 1.1 — Add the admin module

- [ ] **Action.** Create `backend/src/modules/admin/` with `admin.routes.ts`,
      `admin.schema.ts`, and `admin.service.ts`, following the shape of
      `modules/vendors/`. Mount it at `/admin` in `routes/index.ts`, behind
      `requireAuth` then `requireAdmin`.
- [ ] **Verify.** As a non-admin, `curl -b cookies /api/v1/admin/vendors`
      returns 403. As an admin it returns `{ data, meta }`.

### Step 1.2 — Status transitions

- [ ] **Action.** Allow `pending → approved`, `pending → suspended`, and
      `approved → suspended`. Reject anything else with a 409, matching how
      order transitions are handled in `orders.service.ts`.
- [ ] **Verify.** Approving a pending farm returns 200 and its products then
      appear in `GET /api/v1/products`.

---

## Phase 2 — Screen

### Step 2.1 — Feature data layer

- [ ] **Action.** Add `frontend/src/features/admin/` with `types.ts` and
      `api.ts`, following `features/vendors/api.ts`.
- [ ] **Verify.** `npm --prefix frontend run typecheck` passes.

### Step 2.2 — The queue

- [ ] **Action.** Add `frontend/src/pages/admin/AdminVendorsPage.tsx` at
      `/admin/vendors`, listing pending farms with their barangay and
      municipality, and approve and reject buttons. Hide the route entirely
      for non-admins.
- [ ] **Verify.** Approving in the UI moves the farm out of the list and its
      produce appears in Browse.

---

## Acceptance

- [ ] A pending farm is visible to an admin and to nobody else
- [ ] Approving it makes its produce appear in the catalogue
- [ ] A non-admin gets 403 from every admin endpoint
- [ ] `npm run typecheck && npm run lint` pass

## Follow-ups

- Tell the farm it was approved. Needs the SMS channel deferred in
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md)
- A rejection reason the farm can read and act on
