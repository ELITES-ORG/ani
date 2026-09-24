# 0006. Registration collects a full name and a home address

- **Status:** Complete
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

## ⚠️ Deployment sequencing — two releases, not one

**An earlier version of this section was wrong, and would have broken sign-in
on the live site.** It said migrating before the merge was safe because
nullable columns are backward compatible. That is true of adding columns and
false of dropping one: the version of this plan that shipped both in one
release, with `full_name` dropped, made the running API return `500` on login
and registration until the new code deployed. Rehearsed and confirmed, not
theorised. The other order fails too — new code selects columns that do not
exist yet.

A change that **removes or tightens** something the deployed code depends on
cannot be one release on this setup: merging auto-deploys, and Render's
pre-deploy command is paid, so the database and the code never change at the
same instant. It has to be two, with a period where **both** the old and new
code run correctly against the same database.
See [change the database schema](../guides/change-the-database-schema.md).

**Release 1 — expand** (phases 1–4). Add, never remove.

1. Apply the migration to Supabase **before** merging:

   ```powershell
   $env:DATABASE_URL = "<the session pooler URI>"
   npm --prefix backend run db:migrate
   ```

2. Merge. Render deploys the new code.

Rehearsed against a database holding accounts created by the previous
release: with the expand migration applied, the **old** code still signed
in, served `/me`, and registered with its old form; the **new** code signed
in both backfilled accounts and an account the old code created in between.

**Release 2 — contract** (phase 5). Remove what nothing reads any more.
The order flips: **merge first**, wait for Render to show *Live*, **then**
migrate — because until the new code is running, the old code still reads
`full_name`.

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Schema — expand | 2 / 2 | Complete |
| 2. API | 3 / 3 | Complete |
| 3. The form | 3 / 3 | Complete |
| 4. Account screen and docs | 2 / 2 | Complete |
| 5. Contract — separate release | 3 / 3 | Complete |

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

**Location stays nullable permanently.** It cannot be backfilled — nobody
knows where the existing accounts live — so it is required by the API for new
registrations and null for accounts that predate this. A `NOT NULL` would mean
inventing an address for someone, which is worse than an empty one.

`first_name` and `last_name` are nullable **in the database** during release 1
and become `NOT NULL` in [phase 5](#phase-5--contract-a-separate-release-after-release-1-is-live).
The API requires both on every new registration regardless.

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

## Phase 5 — Contract: a separate release, after release 1 is live

**Do not start until release 1 is merged, deployed, and its migration has been
applied to Supabase.** This phase removes the transition scaffolding, and it
is only safe once nothing deployed reads `full_name`.

### Step 5.1 — Tighten the schema

- [x] **Action.** In `backend/src/db/schema/users.ts`, make `firstName` and
      `lastName` `.notNull()` and delete `fullName`. Generate the migration,
      then **prepend** the same backfill as release 1 — guarded by
      `first_name IS NULL` — so accounts the previous release created after
      release 1's migration ran are filled in before `SET NOT NULL`.
- [x] **Verify.** Against a database with an account whose `first_name` is
      null, the migration succeeds and that account ends up with a name.

### Step 5.2 — Remove the scaffolding

- [x] **Action.** Stop writing `fullName` in `registerUser`, and delete
      `readNameParts` from `lib/name.ts` along with its tests; read the parts
      directly. `composeFullName` stays.
- [x] **Verify.** `grep -rn "fullName\|full_name\|readNameParts" backend/src`
      shows only `composeFullName`, the `CurrentUser.fullName` contract field,
      and nothing that touches the column.

Rehearsed. In the window between merging and migrating, an account the
previous release created in *its* gap reads with a blank name — no error, and
the migration fills it in moments later. Every other account is unaffected.

### Step 5.3 — Deploy in the contract order

- [x] **Action.** Merge. Wait for Render to report the deploy *Live*. Then,
      and only then, apply the migration to Supabase.
- [x] **Verify.** Before migrating, the new code signs in and registers
      against the release-1 schema. After migrating, it still does, and
      `\d users` shows `first_name` and `last_name` `not null` and no
      `full_name`.

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
- [x] **Release 1: the migration has been applied to Supabase before the merge**
- [x] Release 2 (phase 5) has shipped, merged **before** its migration was applied

Shipped 2026-09-25. Release 1 (#2) migrated then merged; release 2 (#3) merged,
confirmed live, then migrated. Verified on the live site after each: sign-in
for an account created before either release, a new registration with every
field, `/me` returning the derived name and home address, and a 400 for a
missing last name.

## Follow-ups

- Prefill the delivery address at checkout from the home address. The main
  reason this data is worth collecting
- A profile editor. Until one exists a mistyped name or address is permanent,
  which is a poor answer for a field someone filled in on a phone
- Prompt accounts that predate this to add an address, so `home` can
  eventually be non-null
- Reconsider as a three-screen wizard if sign-up completion is poor
