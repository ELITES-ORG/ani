# 0006. Registration collects a full name and a home address

- **Status:** Done
- **Owner:** unassigned
- **Related:** [plan 0005](./0005-sign-up-and-sign-in.md),
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md),
  [ADR 0016](../decisions/0016-the-interface-assumes-no-app-literacy.md),
  [constraints §1 and §5](../explanation/constraints.md)

## Goal

Registration captures a person's name in parts, and where they live, so that
an order can be delivered and a farm knows who is collecting.

## Read this first — the cost of this change

Registration goes from **four fields to ten**. That is a real cost, not a
detail:

> Adoption is the binding constraint. Biliran is ~180,000 people and a
> two-sided marketplace needs both sides before it is useful to either. Every
> step loses people who cannot be spared.
> — [constraints §1](../explanation/constraints.md)

It is still worth doing, because the alternative is asking for a delivery
address at every single checkout, and because a farm cannot hand produce to
someone it cannot identify.

**The mitigation is structural, and it is part of this plan:** the form is one
submit, split into three visually distinct sections, so nobody faces ten
boxes at once.

If sign-up completion turns out to be poor, the documented fallback is a
client-side wizard — three screens, state held in the component, still a
single POST at the end. Do not switch to a multi-request wizard: a drop-out
between requests leaves a half-made account, which is exactly what "required
at sign-up" was meant to prevent.

## Scope

**In scope**

- `first_name`, `middle_name`, `last_name`, `suffix` replacing `full_name`
- `municipality_id`, `barangay_id`, `address_detail` on the account
- Both required at registration (name parts and location, except the two
  optional name fields)
- The registration form, in three sections
- The account screen showing both
- `docs/reference/data-model.md` and `api.md` updated

**Out of scope**

- **Prefilling the delivery address at checkout from the home address.** The
  strongest reason to collect this, and a separate change —
  `orders` already has its own `delivery_*` columns and its own flow. First
  follow-up.
- Editing a name or address after registration. There is no profile editor
  yet, so a typo is currently permanent. Second follow-up, and worth doing
  soon
- Asking existing accounts to fill in their address
- Any change to how vendors store their farm location — that already exists
  and stays as it is

## Prerequisites

- [Plan 0005](./0005-sign-up-and-sign-in.md) is merged. This plan edits
  `RegisterPage.tsx` and `AccountPage.tsx`, which it created
- Local stack running, per [local setup](../getting-started/local-setup.md)

## Blockers

None.

## ⚠️ Deployment sequencing — read before you merge

Merging to `main` **auto-deploys** the API, and Render's Pre-Deploy command is
a paid feature, so migrations do not run themselves
([deployments](../reference/deployments.md)).

Apply the migration to Supabase **before** merging:

```powershell
$env:DATABASE_URL = "<the session pooler URI>"
npm --prefix backend run db:migrate
```

Adding nullable columns is backward compatible — the currently deployed code
ignores them — so migrating first is safe and leaves no window where the API
is newer than its database. Do it the other way round and registration 500s
until someone notices.

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Schema | 3 / 3 | Done |
| 2. API | 3 / 3 | Done |
| 3. The form | 3 / 3 | Done |
| 4. Account screen and docs | 2 / 2 | Done |

---

## Phase 1 — Schema

### Step 1.1 — Name parts and home address

- [x] **Action.** In `backend/src/db/schema/users.ts` add, all **nullable**
      for now:

      | Column | Type | Note |
      |---|---|---|
      | `first_name` | text | |
      | `middle_name` | text | Often the mother's maiden surname here |
      | `last_name` | text | |
      | `suffix` | text | `Jr.`, `Sr.`, `III` |
      | `municipality_id` | uuid → `municipalities` | |
      | `barangay_id` | uuid → `barangays` | |
      | `address_detail` | text | Purok, house number, or a landmark |

      Copy the reference shape from `backend/src/db/schema/vendors.ts`, which
      already relates to both geography tables.

      Leave `full_name` in place for now — step 1.3 removes it.
- [x] **Verify.** `npm run db:generate` produces one migration, and reading
      the SQL shows only `ADD COLUMN`, no drops.

### Step 1.2 — Backfill the names

- [x] **Action.** Hand-write a `UPDATE` into the generated migration that
      fills `first_name` and `last_name` from `full_name`, splitting on the
      **last** space (everything before it is the first name).

      Add a SQL comment saying plainly that this is crude and is only ever
      run against a handful of test accounts — there are no real users yet.
      Anyone reading it in a year must not mistake it for a considered
      name-parsing strategy.
- [x] **Verify.** Against a seeded local database,
      `select full_name, first_name, last_name from users;` splits
      `Juan Dela Cruz` into `Juan` / `Dela Cruz`.

### Step 1.3 — Make the name required, drop the old column

- [x] **Action.** A second migration: `SET NOT NULL` on `first_name` and
      `last_name`, then `DROP COLUMN full_name`.

      **Location stays nullable.** It cannot be backfilled — nobody knows
      where the existing accounts live — so it is required by the API for new
      registrations and null for accounts that predate this. A `NOT NULL`
      here would mean inventing an address for someone, which is worse than
      an empty one.
- [x] **Verify.** `npm run db:reset && npm run db:migrate && npm run db:seed`
      succeeds from nothing, and `\d users` shows `first_name` and
      `last_name` as `not null` with no `full_name`.

---

## Phase 2 — API

### Step 2.1 — Accept the new shape

- [x] **Action.** In `backend/src/modules/auth/auth.schema.ts`, replace
      `fullName` in `registerBody` with:

      ```
      firstName    trim, 1–60, required
      middleName   trim, 1–60, optional
      lastName     trim, 1–60, required
      suffix       trim, 1–10, optional
      municipalitySlug  required
      barangaySlug      required
      addressDetail     trim, 1–200, required
      ```

      Resolve the two slugs to ids the way
      `modules/vendors/vendors.service.ts` already does, including its check
      that the barangay actually belongs to the municipality. Reuse it rather
      than writing a second copy — if that means lifting the lookup into
      `lib/`, do that.
- [x] **Verify.** `curl` a registration with a barangay from a different
      municipality; it answers `400` naming the mismatch, not `500`.

### Step 2.2 — Return it from `/me`

- [x] **Action.** Extend `backend/src/contracts/me.ts`:

      ```ts
      name: { first: string; middle: string | null;
              last: string; suffix: string | null };
      home: { municipality: string; barangay: string;
              addressDetail: string } | null;
      ```

      **Keep `fullName`** as a derived display string composed in
      `auth.service.ts` — `first last suffix`, middle omitted, which is how a
      name is said out loud here. Eleven places read `fullName`; keeping it
      means the UI does not churn, and composing it in one service function
      means there is still only one source of truth.

      `home` is null for accounts that predate this plan.
- [x] **Verify.** `GET /api/v1/me` returns the parts, a sensible `fullName`,
      and `home: null` for an old account.

### Step 2.3 — Keep the address private

- [x] **Action.** Confirm the address appears **only** in `CurrentUser`.
      It must not reach `VendorSummary`, `ProductCard`, `OrderSummary` or any
      other shape — those are read by people who are not its owner.
- [x] **Verify.** `grep -rn "addressDetail" backend/src/contracts/` returns
      `me.ts` and nothing else.

A home address is personal data about a named individual, in a province where
[everyone knows everyone](../explanation/constraints.md). It is collected so a
farm can deliver an order, and that is the only thing it is for.

---

## Phase 3 — The registration form

### Step 3.1 — Three sections, one submit

- [x] **Action.** Restructure `frontend/src/pages/RegisterPage.tsx` into
      three labelled sections, using the existing `.eyebrow` class for the
      headings:

      1. **Your name** — First name, Middle name *(optional)*, Last name,
         Suffix *(optional)*
      2. **How you sign in** — Username, Mobile number, Password
      3. **Where you live** — Municipality, Barangay, and the free-text
         detail

      Still one `<form>` and one submit. Use `TextField` and `SelectField`
      from `components/ui/Field.tsx`; mark the two optional fields with the
      `optional` prop rather than marking everything else required.
- [x] **Verify.** At **360px** the form has three visible section headings
      and no horizontal overflow. Screenshot it.

### Step 3.2 — The location selects

- [x] **Action.** Copy the municipality/barangay pair from
      `pages/VendorRegisterPage.tsx` exactly: barangay disabled until a
      municipality is chosen, and choosing a different municipality clears
      the barangay. Those hooks are already in `features/vendors/api.ts` and
      are cached with `staleTime: Infinity`.

      The free-text field: label **"House or street"**, hint *"How someone
      would find your house — purok, house number, or a nearby landmark."*
- [x] **Verify.** Barangay is disabled until a municipality is picked, and
      changing municipality empties it.

### Step 3.3 — Errors still land on the field

- [x] **Action.** Keep the behaviour plan 0005 established: never disable the
      submit, let the browser block and focus the first offending field, and
      put the duplicate-username `CONFLICT` on the username field.
- [x] **Verify.** Submitting with an empty last name moves focus to it.
      Submitting a taken username shows the error on the username field.

---

## Phase 4 — Account screen and documentation

### Step 4.1 — Show what was collected

- [x] **Action.** `pages/AccountPage.tsx` gains a "Where you live" row:
      barangay, municipality, and the detail. For an account with
      `home: null`, say so plainly — "Not added yet" — rather than leaving a
      blank.
- [x] **Verify.** Both cases render. Screenshot at 360px.

### Step 4.2 — Update the reference

- [x] **Action.** Update `docs/reference/data-model.md` (the `users` table)
      and `docs/reference/api.md` (the `register` body and the `/me` shape)
      in this pull request.
- [x] **Verify.** `npm run docs:check` passes.

---

## Acceptance

- [x] A new account cannot be created without first name, last name,
      municipality, barangay and the address detail
- [x] Middle name and suffix are genuinely optional
- [x] A barangay from the wrong municipality is a 400, not a 500
- [x] `/me` returns the name parts, a derived `fullName`, and `home`
- [x] `home: null` for accounts created before this, and nothing crashes
- [x] The address appears in no contract but `me.ts`
- [x] The form shows three sections and fits 360px
- [x] `npm run typecheck && npm run lint && npm test && npm run docs:check`
- [ ] **The migration has been applied to Supabase before the merge**

## Follow-ups

- Prefill the delivery address at checkout from the home address. The main
  reason this data is worth collecting
- A profile editor. Until one exists a mistyped name or address is permanent,
  which is a poor answer for a field someone filled in on a phone
- Prompt accounts that predate this to add an address, so `home` can
  eventually be non-null
- Reconsider as a three-screen wizard if sign-up completion is poor
