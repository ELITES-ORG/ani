# 0002. Product photos

- **Status:** Draft
- **Owner:** unassigned
- **Related:** [constraints §2](../explanation/constraints.md),
  [plan 0001](./0001-deployment.md)

## Goal

A vendor can attach photos to a listing from their phone, and a buyer sees
them in the catalogue without waiting on a multi-megabyte download.

## Scope

**In scope**

- Resizing in the browser before upload
- Upload to Supabase Storage, via a short-lived signed URL issued by the API
- Up to six images per product, ordered, first one used as the card image

**Out of scope**

- Image moderation — part of the admin work in [plan 0003](./0003-admin-approval-queue.md)
- A CDN in front of Supabase Storage

## Prerequisites

- Supabase project exists ([plan 0001](./0001-deployment.md) phase 1)
- A `produce` storage bucket, not publicly writable
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set on Render

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Resize | 0 / 1 | Not started |
| 2. Upload | 0 / 2 | Not started |
| 3. Display | 0 / 1 | Not started |

---

## Phase 1 — Resize before anything leaves the phone

### Step 1.1 — Client-side resize

- [ ] **Action.** Add `frontend/src/lib/image.ts` that takes a `File`, draws
      it to a canvas at a maximum edge of 1600px, and exports WebP at ~0.8
      quality. Reject anything that is not an image.
- [ ] **Verify.** A unit test with a generated 4000px canvas produces an
      output under 400KB with the longest edge at 1600.

This is the whole point of the plan. A vendor's camera produces 4MB files, and
uploading them unresized over prepaid data is the single worst thing this
feature could do to the people it is for.

---

## Phase 2 — Upload

### Step 2.1 — Signed upload URLs

- [ ] **Action.** Add `POST /api/v1/media/upload-url` in a `media` module,
      returning a signed Supabase Storage URL scoped to one object path. The
      service-role key never leaves the API.
- [ ] **Verify.** The endpoint returns a URL; a `PUT` to it with a WebP body
      succeeds, and the same `PUT` after expiry fails.

### Step 2.2 — Attach to a product

- [ ] **Action.** Extend the create and update product endpoints to accept
      `imageUrls`, validating that each is inside the project's storage
      origin. Never accept an arbitrary URL.
- [ ] **Verify.** A product created with two images returns them in order;
      one pointing elsewhere is rejected with 400.

---

## Phase 3 — Display

### Step 3.1 — Serve them responsibly

- [ ] **Action.** Use `loading="lazy"` and `decoding="async"` on catalogue
      images, with an explicit aspect ratio so the list does not reflow as
      images arrive.
- [ ] **Verify.** Lighthouse on a throttled 3G profile reports no layout
      shift from images on the Browse page.

---

## Acceptance

- [ ] A vendor can attach a photo taken on their phone
- [ ] Nothing over 400KB is uploaded
- [ ] The catalogue does not reflow while images load
- [ ] A product with no photo still looks deliberate

## Follow-ups

- Deleting an image should remove the stored object, not only the URL
- A scheduled sweep for objects no product references
