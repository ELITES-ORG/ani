# 0003. Admin approval queue — accounts and farms

- **Status:** In progress
- **Owner:** Rey
- **Related:** [ADR 0020](../decisions/0020-every-account-is-reviewed-before-it-can-order.md),
  [ADR 0011](../decisions/0011-vendors-are-reviewed-before-listing.md),
  [ADR 0007](../decisions/0007-one-account-selling-is-a-role.md),
  [ADR 0016](../decisions/0016-the-interface-assumes-no-app-literacy.md),
  [constraints §1, §4, §5](../explanation/constraints.md),
  [change the database schema](../guides/change-the-database-schema.md)

## Goal

Every new account, and every new farm, is reviewed by an admin from inside the
app. A new account can sign in, browse and fill a basket, but cannot place an
order or register a farm until an admin approves it. An admin can approve, or
reject with a reason the person can read, fix, and resubmit. Nobody who has an
account today is locked out.

Before this plan: buyer accounts are never reviewed, farms are approved by a
hand-written SQL `update`, and there is no admin screen.

> This plan was first written to cover farms only. It was rewritten on
> 2026-09-29, before any step was started, when the owner decided every
> account is reviewed ([ADR 0020](../decisions/0020-every-account-is-reviewed-before-it-can-order.md)).

## Read this first — what is already decided

These were settled with the owner. Do not reopen them; if one turns out to be
unworkable, stop and ask.

| Question | Decision |
|---|---|
| Who is reviewed | **Every** new account, buyer or seller. Registering a farm is a second, separate review |
| Why | Fake or prank orders (a farm harvests on the strength of an order), keeping Ani to real Biliran residents, and general trust |
| What a pending account can do | Sign in, browse, fill a basket, see its own status. **Cannot** place an order or register a farm |
| Rejection | Rejected **with a written reason** the person sees. They fix their details and it goes back to `pending` |
| Order of reviews | Account first. "Register my farm" is not available until the account is approved |
| Storage | Columns on the row (approach A in ADR 0020) — not a `reviews` table |
| Existing accounts | Approved by the migration. Nobody is locked out |

Decided while writing this plan, to keep scope tight — flagged to the owner at
handoff:

| Question | Decision |
|---|---|
| Can an **approved** account edit its details? | Not in this plan. `PATCH /me` works only while `pending` or `rejected`. A general profile editor stays a follow-up (it already is one, from plan 0006) |
| Is a **farm** rejection a dead end? | No. A rejected farm gets the same reason-and-resubmit flow as an account; ADR 0011 names a stuck farm as the worst experience for supply |
| Suspending accounts or farms from the admin screen | Out of scope. `suspended_at` and `vendors.status = 'suspended'` stay SQL-only, unchanged |
| Admin screen location | `/admin`, one screen, two sections. Reached from a button on the Account screen, not a fifth tab ([ADR 0013](../decisions/0013-bottom-navigation-on-phones.md)) |
| Global "awaiting approval" banner | No. The three screens where it matters — Basket, Sell, Account — say so in place |

## Scope

**In scope**

- `users`: `approval_status`, `review_note`, `reviewed_at`, `reviewed_by`
- `vendors`: `rejected` added to `vendor_status`, plus `review_note`,
  `reviewed_at`, `reviewed_by`
- An `admin` backend module: list pending accounts and farms; approve or
  reject each
- `requireApprovedAccount` middleware on placing an order, registering a farm,
  and listing produce
- `PATCH /me` — a pending or rejected account corrects its details and is
  resubmitted
- `GET /vendors/mine` and `PATCH /vendors/mine` — a rejected farm is corrected
  and resubmitted
- `CurrentUser` gains `approval` and the farm's `reviewNote`; `home` gains its
  two slugs so the edit form can be prefilled
- An admin-only `/admin` screen
- The pending and rejected states on Basket, Sell and Account; an
  `/account/edit` screen
- Reference docs, constraints, ADR 0020 accepted

**Out of scope** — and where it is handled instead

- **Telling someone they were approved.** No channel exists; SMS is deferred in
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md).
  First follow-up
- A review history (rejected, resubmitted, approved). Columns only hold the
  latest decision — see ADR 0020's alternatives
- Editing details after approval — the profile-editor follow-up from plan 0006
- Suspending from the UI; moderating individual products; image moderation
  (plan 0002 points here for it — it stays deferred)
- Waray/Filipino copy for the new screens. Write English, keep it short and
  plain, and add it to the translation follow-up

## Prerequisites

Every one of these must be true before step 1.1. Each has a command.

1. **You are on `feat/approval-queue`, not `main`.** Pushing to `main`
   auto-deploys the API and the PWA and there is no branch protection
   ([deployments](../reference/deployments.md)). The branch already exists,
   cut from `main` at `2db9f3c`, and holds this plan.

   ```bash
   git switch feat/approval-queue
   git branch --show-current     # feat/approval-queue
   ```

   `git status` may show `backend/package-lock.json` and
   `frontend/package-lock.json` as modified before you start. They are not
   yours: do not stage, commit, or revert them.

2. **The commit hook is installed.** It rejects AI attribution trailers
   ([ADR 0014](../decisions/0014-ai-attribution-is-blocked-by-a-check.md)).

   ```bash
   npm run hooks:install
   ```

3. **The local stack runs from a clean database.**
   See [local setup](../getting-started/local-setup.md).

   ```bash
   npm run db:reset && npm run db:migrate && npm run db:seed
   npm run dev:api     # http://localhost:4000
   npm run dev:web     # http://localhost:5173
   curl -s http://localhost:4000/api/v1/health
   ```

   Health answers `"database":"ok"`.

4. **The baseline is green before you change anything**, so a failure later is
   yours to own and not inherited.

   ```bash
   npm run typecheck && npm run lint && npm test && npm run docs:check
   ```

5. **A local admin and a local buyer exist.** Register two accounts through the
   API (the `curl` in [local setup](../getting-started/local-setup.md)), e.g.
   `adminlocal` and `buyerlocal`, then:

   ```bash
   docker exec ani-postgres psql -U ani -d ani \
     -c "update users set is_admin=true where username='adminlocal';"
   ```

   Keep their cookie jars (`-c /tmp/ani-admin`, `-c /tmp/ani-buyer`); every
   Verify below uses them.

6. **Chrome is installed**, for `node scripts/screenshot.mjs`
   ([commands](../reference/commands.md)). Every screen change is checked at
   **390px** wide.

7. **At release time, the owner is available.** Applying a migration to
   Supabase and making the first production admin need dashboard access you
   may not have. See [Deployment sequencing](#deployment-sequencing--one-release).

## Blockers

None to start. Release 1 cannot ship until **a production admin account
exists** — see step 3.5.

## Deployment sequencing — one release

**Changed on 2026-09-29, when both releases were built and ready together.**
Both ship in **one pull request**: migrate Supabase, then merge, then clear
the queue at once. Step 3.5 is the whole deploy; step 6.3 is folded into it.

Why this is safe as one release, where it was first planned as two:

- **The admin tools and the enforcement arrive together**, so nobody is
  blocked with no way to clear them. The only accounts `pending` at the
  merge are those that signed up between the migration and the merge. The
  migration approves everyone who existed before it. The owner clears that
  handful in `/admin` as soon as the merge is live.
- **The PWA deploys before the API.** Vercel is live in about a minute,
  Render's free build takes several, so for a few minutes the new screens
  talk to the old API, whose `/me`, sign-in and registration answers have no
  `approval`. Unguarded, Basket, Sell and Account would crash for every
  signed-in person in that window. `withReviewDefaults` in
  `frontend/src/features/auth/current-user.ts` reads a missing `approval` as
  approved. That is the truth in that window, because the old API refuses
  nobody. It can be removed once the deploy is live.
- **The old PWA against the new API** is the other direction: a pending
  person in a tab opened before the deploy who taps "Place order" gets the
  403's plain message in the existing error notice. Nothing crashes.

The original two-release plan follows, as the record of what was weighed.

Split so that **the admin tools are live before anybody is blocked.** If
enforcement shipped first, every new sign-up would be stuck with nobody able to
clear them.

**Release 1 — schema, admin API, admin screen** (phases 1–3). Records
approval state and lets an admin work the queue. Enforces nothing new.
Contains the only migration. Order: **migrate Supabase, then merge**.

**Release 2 — enforcement and the owner's screens** (phases 4–6). No
migration. Order: **work the production queue to empty, then merge.** Every
account created between release 1 and release 2 is `pending`, and release 2 is
what makes `pending` mean something. Approving them first means no real person
is blocked by the deploy itself.

Each release is its own pull request against `main`. Do not merge either one
yourself unless the owner has told you to.

### Why release 1 is one release, not two

The [schema guide](../guides/change-the-database-schema.md) says a new
`NOT NULL` column takes two releases. That rule exists because the old code's
`INSERT` would fail against a required column it does not know about. Here the
column has a **database default**, so the old code's inserts succeed and get
`pending`, and the old code never reads the column. The window is safe in both
directions. **Step 1.3's rehearsal is what proves this. Do not skip it.**

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Schema | 3 / 3 | Done |
| 2. Admin API | 5 / 5 | Done |
| 3. Admin screen — release 1 ships | 4 / 5 | In progress; 3.5 outstanding — the owner's migration, merge and live check |
| 4. Enforcement API | 3 / 3 | Done |
| 5. The applicant's screens | 5 / 5 | Done |
| 6. Docs and release 2 | 2 / 3 | In progress; 6.3 superseded — folded into 3.5, one release; its live Verify is still outstanding |

---

## Phase 1 — Schema

### Step 1.1 — Add the columns

- [x] **Action.** In `backend/src/db/schema/enums.ts`:

      ```ts
      /** A person is reviewed before they can order or sell. ADR 0020. */
      export const accountApprovalStatus = pgEnum('account_approval_status', [
        'pending',
        'approved',
        'rejected',
      ]);
      ```

      and extend `vendorStatus` to
      `['pending', 'approved', 'rejected', 'suspended']`. **Rejected** is "not
      approved, here is why, fix it"; **suspended** is "was approved, now
      paused". They are different outcomes with different next steps.

      In `backend/src/db/schema/users.ts`, beside `isAdmin`:

      | Column | Drizzle | Note |
      |---|---|---|
      | `approval_status` | `accountApprovalStatus('approval_status').notNull().default('pending')` | |
      | `review_note` | `text('review_note')` | Admin's reason. Set on reject; cleared on resubmit |
      | `reviewed_at` | `timestamp(..., { withTimezone: true })` | |
      | `reviewed_by` | `uuid('reviewed_by').references((): AnyPgColumn => users.id, { onDelete: 'set null' })` | Self-reference needs the `AnyPgColumn` annotation |

      Add `index('users_approval_status_idx').on(table.approvalStatus)` — the
      queue filters on it.

      In `backend/src/db/schema/vendors.ts`, the same `review_note`,
      `reviewed_at`, `reviewed_by` (→ `users.id`, `set null`). The existing
      `vendors_status_idx` already serves the farm queue.

      Comment each new column the way the neighbouring columns are commented:
      why it exists, not what type it is.

      *Done 2026-09-29.* One change moved here from step 2.1: widening the
      `vendor_status` enum makes `vendors.service.ts` and `auth.service.ts`
      fail against `VendorStatus` in `contracts/vendors.ts`, so this Verify
      cannot pass until the contract gains `'rejected'` too. That one line
      is made in this step; the rest of 2.1 is unchanged.
- [x] **Verify.** `npm --prefix backend run typecheck` passes.

### Step 1.2 — Generate, then hand-edit the migration

- [x] **Action.** `npm --prefix backend run db:generate -- --name approval_review`
      (call the backend script directly: through the root script, npm swallows
      `--name`), then **read the SQL**. Drizzle will write something like:

      ```sql
      ALTER TABLE "users" ADD COLUMN "approval_status" "account_approval_status" DEFAULT 'pending' NOT NULL;
      ```

      **That would mark every existing account `pending` and lock everyone
      out once release 2 ships.** Replace it by hand with:

      ```sql
      -- Every account that exists before ADR 0020 is approved: nobody using Ani
      -- today is locked out. Only accounts created from here on start pending.
      ALTER TABLE "users" ADD COLUMN "approval_status" "account_approval_status" DEFAULT 'approved' NOT NULL;
      --> statement-breakpoint
      ALTER TABLE "users" ALTER COLUMN "approval_status" SET DEFAULT 'pending';
      ```

      The final default, `pending`, matches the schema, so the snapshot does
      not need editing.

      `ALTER TYPE "vendor_status" ADD VALUE 'rejected'` must **not** be
      followed by anything in the same migration that uses `'rejected'`.
      Postgres refuses to use a new enum value inside the transaction that
      added it. Nothing in this migration needs to.

      Everything else must be `CREATE TYPE`, `ADD COLUMN`, `ADD CONSTRAINT`,
      `CREATE INDEX`. **No `DROP`, no `RENAME`.**

      *Done 2026-09-29.* `0003_approval_review.sql`, hand-edited as above.
      In PowerShell the separator must be quoted (`'--' --name …`), or
      PowerShell eats it and Drizzle picks a random name.
- [x] **Verify.** On a database that already holds the two prerequisite
      accounts:

      ```bash
      npm run db:migrate
      docker exec ani-postgres psql -U ani -d ani \
        -c "select username, approval_status from users;"
      ```

      Both existing accounts read `approved`. Then register a third account
      and re-run the query: it reads `pending`.

      *Result:* `adminlocal` and `buyerlocal` read `approved`; `newlocal`,
      registered after the migration, reads `pending`. The column default
      is `'pending'::account_approval_status`.

### Step 1.3 — Rehearse the window

- [x] **Action.** Prove the **old** code works against the **new** schema,
      exactly as the [schema guide §1a](../guides/change-the-database-schema.md)
      requires:

      Run the old code from a **separate worktree**. `dev:api` is
      `tsx watch`, so switching branches under a running API would silently
      reload it as the new code and prove nothing.

      1. `git worktree add ../ani-main main`, copy `backend/.env` into it,
         `npm --prefix ../ani-main/backend install`.
      2. `npm run db:reset`, then from `../ani-main`: `npm run db:migrate &&
         npm run db:seed`, and start its API (`npm run dev:api` there).
      3. Against that API: register an account, register a farm, approve it
         by SQL, list a product, place an order.
      4. From **your** checkout, run `npm run db:migrate` only. `main`'s API
         keeps running.
      5. Against `main`'s API: sign in, `GET /me`, register a new account,
         place another order.
      6. Stop it, start your branch's API against the same database, sign in
         with each account, and `GET /me`.
         Then `git worktree remove ../ani-main`.
- [x] **Verify.** Step 5: every call succeeds. Step 6: the accounts from
      step 3 read `approved`, and the one registered in step 5 reads
      `pending`. Write the result in this step, as plan 0006 did.

      *Result, 2026-09-29 — passes.* `main` at `2db9f3c` in a worktree,
      against a fresh local database migrated by `main` (three migrations).
      - Step 3, old code, old schema: a farmer registered (201), registered
        a farm (201), was approved by SQL, listed Kangkong (201); a second
        account placed an order (201).
      - Step 4: `0003_approval_review` applied from this branch while
        `main`'s API kept running. Both existing accounts read `approved`;
        `vendor_status` reads `{pending,approved,rejected,suspended}`.
      - Step 5, old code, **new** schema: sign-in 200, `GET /me` 200 for
        the buyer and the farmer (the farmer's farm still `approved`); a
        new account registered (201) and got `pending` from the column
        default; that account and the old buyer each placed an order (201);
        `GET /products` 200; the farm's `GET /orders/received` 200 with all
        three orders.
      - Step 6, this branch's API, same database: sign-in and `GET /me`
        200 for all three. `farmerold` and `buyerold` read `approved`,
        `windowacct` (registered in step 5) reads `pending`. At this point
        `/me` does not yet carry `approval` (step 2.2 adds it), so the
        status was read from the table here, and read again through `/me`
        in step 2.2's Verify against these same three accounts.

      The one-release reasoning above holds: the old code's inserts succeed
      against the defaulted column and it never reads it.

---

## Phase 2 — Admin API

Copy the shape of `backend/src/modules/vendors/` for the module, and
`ALLOWED_TRANSITIONS` in `modules/orders/orders.service.ts` for how a legal
move is expressed.

### Step 2.1 — Contracts

- [x] **Action.** Create `backend/src/contracts/admin.ts`. No Drizzle types
      ([ADR 0008](../decisions/0008-one-definition-of-an-api-shape.md)).

      ```ts
      export type ReviewDecision = 'approve' | 'reject';

      /** A person awaiting review. Personal data: admins only. */
      export interface PendingAccount {
        id: string;
        username: string;
        fullName: string;
        phone: string;
        email: string | null;
        home: { municipality: string; barangay: string; addressDetail: string } | null;
        registeredAt: string; // ISO
      }

      /** A farm awaiting review, with who is behind it. */
      export interface PendingFarm {
        id: string;
        farmName: string;
        description: string | null;
        municipality: string;
        barangay: string;
        landmark: string | null;
        registeredAt: string;
        owner: { id: string; username: string; fullName: string; phone: string };
      }

      export interface ReviewResult {
        id: string;
        status: 'approved' | 'rejected';
        reviewedAt: string;
      }
      ```

      In `contracts/me.ts`:

      ```ts
      export type AccountApprovalStatus = 'pending' | 'approved' | 'rejected';
      // on CurrentUser:
      approval: { status: AccountApprovalStatus; note: string | null };
      home: { municipality: string; municipalitySlug: string;
              barangay: string; barangaySlug: string; addressDetail: string } | null;
      vendor: { id: string; farmName: string; status: VendorStatus;
                reviewNote: string | null } | null;
      ```

      In `contracts/vendors.ts`: `VendorStatus` gains `'rejected'`.

      Update the `CurrentUser` doc comment: the home address now appears on
      `CurrentUser` **and** `PendingAccount`, and nowhere else.

      *Done 2026-09-29.* `VendorStatus` had already gained `'rejected'` in
      step 1.1.
- [x] **Verify.** `npm run typecheck`. It **fails** in
      `frontend/src/pages/AccountPage.tsx` (`FARM_STATUS` is missing
      `rejected`) and in `auth.service.ts` (`currentUser` is missing fields).
      That is the contract doing its job. Both are fixed in steps 2.2 and 3.4.

      *Result:* exactly those two. The root script stops at the backend, so
      the frontend was run on its own to see the `FARM_STATUS` error.

### Step 2.2 — `currentUser` returns the new fields

- [x] **Action.** In `backend/src/modules/auth/auth.service.ts`,
      `currentUser()` returns `approval: { status: user.approvalStatus, note:
      user.reviewNote }`, the two slugs inside `home`, and `reviewNote` on
      `vendor`.
- [x] **Verify.** `curl -s -b /tmp/ani-buyer localhost:4000/api/v1/me`
      includes `"approval":{"status":"approved","note":null}` for a
      pre-migration account and `"pending"` for a new one.

      *Result:* run against step 1.3's database. `buyerold` and `farmerold`
      (created by `main` before the migration) read
      `"approval":{"status":"approved","note":null}`; `windowacct` (created
      by `main` after it) reads `"pending"`. `home` carries
      `"municipalitySlug":"naval"` and `"barangaySlug":"atipolo"`, and the
      farmer's `vendor` carries `"reviewNote":null`.

### Step 2.3 — The review body, tested first

- [x] **Action.** Create `backend/src/modules/admin/admin.schema.ts`:

      ```ts
      export const reviewBody = z.discriminatedUnion('decision', [
        z.object({ decision: z.literal('approve') }),
        z.object({
          decision: z.literal('reject'),
          // The person reads this and acts on it. Say what to fix.
          note: z.string().trim().min(3).max(300),
        }),
      ]);
      export const pendingQuery = z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      });
      ```

      Write `admin.schema.test.ts` **before** the schema (vitest, beside it,
      like `lib/money.test.ts`): approve with no note passes; reject with no
      note fails; reject with a whitespace-only note fails; an unknown
      decision fails; a 301-character note fails.
- [x] **Verify.** `npm --prefix backend test` — the new tests fail before the
      schema exists and pass after.

      *Result:* before, the file failed to import `./admin.schema.js`
      (1 failed file, 15 existing tests passing). After, 3 files and 23
      tests pass. Beyond the five named cases, the file also checks that a
      note is trimmed, that exactly 300 characters passes, and that
      `pendingQuery` defaults to page 1 of 20 and caps `limit`.

### Step 2.4 — The service

- [x] **Action.** `backend/src/modules/admin/admin.service.ts`:

      - `listPendingAccounts(page, limit)` →
        `{ data: PendingAccount[]; meta: ListMeta }`. `approval_status =
        'pending'`, **oldest first**: first come, first served, so nobody
        waits longer because they registered on a busy day. Join geography
        for `home`; compose `fullName` with `composeFullName` from
        `lib/name.ts`.
      - `listPendingFarms(page, limit)` → the same for `vendors.status =
        'pending'`, joined to its owner and geography.
      - `reviewAccount(adminId, userId, decision)` and
        `reviewFarm(adminId, vendorId, decision)` → `ReviewResult`.

      The review functions use **one conditional update**, not a read then a
      write, so two admins tapping at once cannot both succeed:

      ```ts
      const [row] = await db.update(users)
        .set({ approvalStatus: next, reviewNote: note, reviewedAt: new Date(),
               reviewedBy: adminId, updatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.approvalStatus, 'pending')))
        .returning();
      if (!row) {
        // Tell apart "no such person" from "already reviewed".
        const exists = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (!exists) throw AppError.notFound('No account with that id.');
        throw AppError.conflict('This account has already been reviewed.');
      }
      ```

      `note` is the rejection reason, or `null` on approve. The legal moves
      are exactly `pending → approved` and `pending → rejected`, for both
      tables. Say so in a doc comment. `rejected → pending` happens only
      through the owner's resubmission (phase 4), never by an admin.

      An admin must not review their own account: `userId === adminId` →
      `AppError.forbidden('You cannot review your own account.')`.

      *Done 2026-09-29.* Ties in "oldest first" break on `id`, so paging is
      stable. The self-review rule covers accounts only, as written: with
      one admin in production, blocking their own farm would send them back
      to SQL.

      *Ruling, flagged for the owner:* a farm is approved only once its
      owner's account is. The step does not say, and without it a farm run
      by a `pending` or `rejected` account could go live and sell. That runs
      against ADR 0020, where the person is checked before anything else.
      `reviewFarm` adds "owner is `approved`" to the same conditional update
      on approve (a subquery, so no race between the two reviews). When no
      row changes, a farm that is still `pending` gets a distinct 409:
      "Approve the owner's account before their farm." Rejecting such a farm
      stays allowed. `PendingFarm.owner` carries `approvalStatus` so the
      card can say why.
- [x] **Verify.** `npm --prefix backend run typecheck && npm --prefix backend run lint`.

      *Result:* both clean. For the ruling above, first seen failing:
      approving a farm whose owner was `pending` answered 200. After the
      fix it answers 409 with that message. Approving the owner, then the
      farm, gives 200 each, and a second approval of the farm gives 409
      "already been reviewed".

### Step 2.5 — Routes, mounted behind admin

- [x] **Action.** `backend/src/modules/admin/admin.routes.ts`:

      | Method | Path | Body / query | Answers |
      |---|---|---|---|
      | `GET` | `/accounts` | `page`, `limit` | `{ data: PendingAccount[], meta }` |
      | `PATCH` | `/accounts/:id/review` | `reviewBody` | `{ data: ReviewResult }` |
      | `GET` | `/farms` | `page`, `limit` | `{ data: PendingFarm[], meta }` |
      | `PATCH` | `/farms/:id/review` | `reviewBody` | `{ data: ReviewResult }` |

      Guard the whole router once, then `writeLimiter` on the two `PATCH`es:

      ```ts
      export const adminRouter: Router = Router();
      adminRouter.use(requireAuth, requireAdmin);
      ```

      Mount it in `backend/src/routes/index.ts` as `apiRouter.use('/admin',
      adminRouter)`. Parse `:id` with `z.string().uuid()`. Relative imports
      end in `.js`. No `asyncHandler`. Throw `AppError`, never hand-write an
      error.
- [x] **Verify.**

      ```bash
      API=http://localhost:4000/api/v1
      curl -s -o /dev/null -w '%{http_code}\n' -b /tmp/ani-buyer $API/admin/accounts   # 403
      curl -s -o /dev/null -w '%{http_code}\n' $API/admin/accounts                     # 401
      curl -s -b /tmp/ani-admin $API/admin/accounts        # { data: [the pending one], meta }
      curl -s -b /tmp/ani-admin -X PATCH $API/admin/accounts/<id>/review \
        -H 'Content-Type: application/json' -d '{"decision":"reject"}'                # 400
      curl -s -b /tmp/ani-admin -X PATCH $API/admin/accounts/<id>/review \
        -H 'Content-Type: application/json' -d '{"decision":"approve"}'               # 200
      # the same PATCH again                                                          # 409
      ```

      Register a farm on an approved account, then approve it through
      `/admin/farms/<id>/review`. Its products appear in
      `GET /api/v1/products` once it lists one.

      *Result, 2026-09-29:* buyer 403, signed out 401; the admin's list is
      `{ data: [windowacct], meta: { page: 1, limit: 20, total: 1 } }`.
      Reject with no note 400 (`note`: expected string), approve 200, the
      same approve again 409 "This account has already been reviewed.",
      and the queue is then empty. Also checked: reviewing your own account
      403; an unknown id 404; a malformed id 400; a whitespace-only note
      400; a reject with a reason 200, and that person's `/me` reads
      `"approval":{"status":"rejected","note":"Barangay does not match your address"}`.
      Farm: registered on `buyerlocal` (201), listed in `/admin/farms` with
      its owner, listing produce before approval 403; two approvals of it
      sent **at the same instant** (`curl --parallel`) answered one 200 and
      one 409; Kamote listed after (201) and appears in `GET /products`.

---

## Phase 3 — Admin screen (release 1 ships at the end)

Read [`frontend/DESIGN.md`](../../frontend/DESIGN.md) and
[add a UI component](../guides/add-a-ui-component.md) first. Tokens only.
`StatusPill` for status, `EmptyState` for an empty queue, `ConfirmDialog` for
both actions.

### Step 3.1 — Feature data layer

- [x] **Action.** `frontend/src/features/admin/types.ts` re-exports the
      contracts from `@contracts/admin`. `frontend/src/features/admin/api.ts`,
      following `features/vendors/api.ts`: an `adminKeys` factory,
      `usePendingAccounts()`, `usePendingFarms()`, `useReviewAccount()`,
      `useReviewFarm()`. The two list hooks take an `enabled` flag, so the
      Account screen fetches them only for an admin. On success a review
      mutation invalidates its own list, which also refreshes the count on the
      Account button (step 3.4).

      *Done 2026-09-29.* The mutations invalidate on **settled**, not only on
      success: a 409 means another admin reviewed that row first, and the
      stale card should leave the list then too. `types.ts` also holds
      `ReviewPayload`, the request body, beside the re-exported contracts.
      `onSettled` **returns** the invalidation, so the mutation stays pending
      until the list has refetched. Otherwise the dialog closes and the
      reviewed card lingers for a round trip, inviting a second tap. An
      account review invalidates both lists, since a farm card shows its
      owner's account status.
- [x] **Verify.** `npm --prefix frontend run typecheck` passes (apart from
      `FARM_STATUS`, fixed in 3.4).

      *Result:* the only error is `FARM_STATUS` in `AccountPage.tsx`.

### Step 3.2 — A slot in `ConfirmDialog`

- [x] **Action.** Rejecting needs a reason typed inside the dialog.
      `ConfirmDialog` has no slot for one. Add an optional `children` prop,
      rendered between the description and the buttons, and nothing else.
      Every existing caller is unchanged.
- [x] **Verify.** The Cart and Account dialogs look identical before and
      after: screenshot both at 390px.

      *Result:* the Cart "Remove Kangkong?" dialog is byte-identical before
      and after. The Account "Sign out?" dialog is identical; the only
      pixels that differ are the basket badge in the bottom bar, because the
      screenshot profile held a seeded basket on the second run and not the
      first.

### Step 3.3 — The queue

- [x] **Action.** Feature components in `frontend/src/features/admin/`, each
      with one job and a small typed props API:

      - `AccountReviewCard.tsx` — `{ account: PendingAccount; onApprove():
        void; onReject(): void }`. Name, username, phone (use `formatPhone`),
        home address, "Signed up 3 days ago". Two full-width buttons:
        **Approve** (primary) and **Reject** (secondary, not `danger`:
        rejection is recoverable).
      - `FarmReviewCard.tsx` — the same for a `PendingFarm`, showing the
        owner's name and phone under the farm.
      - `ReviewDialog.tsx` — wraps `ConfirmDialog`. Approve: "Approve Juan
        Dela Cruz? They will be able to place orders straight away." Reject:
        a `TextField` labelled **"What should they fix?"**, hint *"They will
        see this exactly as you write it."*, required, 300 max. Holds the
        note in `useState`, since the server does not know it yet.

      Then `frontend/src/pages/AdminPage.tsx` at `/admin`, composing only:
      two sections, **"New accounts"** and **"New farms"**, each with a count
      in its heading and all four states (pending → `Spinner`, error →
      `ErrorNotice` with retry, empty → `EmptyState` "Nobody is waiting",
      loaded → cards). One `ReviewDialog` at page level, driven by which card
      was tapped.

      **Non-admins never see it:** signed out → the same sign-in
      `EmptyState` the Account page uses; signed in but `!user.isAdmin` →
      render `NotFoundPage`. The API is the real guard (step 2.5); this only
      avoids showing a screen that would 403.

      Register the route in `App.tsx` and add `'/admin': 'Review sign-ups'` to
      `TITLES` in `components/AppHeader.tsx`.

      *Done 2026-09-29.* Choices the step left open:
      - "Signed up 3 days ago" comes from a new pure `lib/days-ago.ts`,
        tested first (`days-ago.test.ts`, 5 tests). It counts calendar days
        in Philippine time, whatever the phone's clock zone.
      - `ConfirmDialog`'s confirm button is not a submit button, so
        `ReviewDialog` calls `reportValidity()` on its own form. A reason of
        only spaces passes `required`, so it also sets a custom validity
        when the trimmed reason is under 3 characters, matching the API's
        `min(3)`.
      - An empty section's `EmptyState` offers **"Check again"** (a refetch)
        as its way forward, for the same reason as the pending notice in
        5.1: nothing refetches on focus.
      - A failed review (a 409 from another admin, or a dropped connection)
        closes the dialog and shows an `ErrorNotice` above the queues.
      - The account card also shows the email, when one was given. It is on
        the admin-only `PendingAccount` for this purpose.
      - Enter in the reason field submits the form, bypassing the busy
        confirm button. `ReviewDialog` ignores a confirm while `loading`,
        and the field is disabled then, so one tap is one request.
      - A farm card shows its owner's account status as a `StatusPill`.
        When that account is not approved, a line says what to do first
        (step 2.4's ruling).
- [x] **Verify.** Approving in the UI removes the card and its produce, once
      listed, appears in Browse. Rejecting without a reason is blocked by the
      browser with focus on the field. Screenshot `/admin` at 390px with one
      card of each kind, and empty. Signed in as `buyerlocal`, `/admin` shows
      Not found.

      *Result, 2026-09-29, driven through `scripts/screenshot.mjs` at 390px:*
      - One card of each kind rendered: "New accounts · 1" (Juan Dela Cruz,
        "Signed up 3 days ago") and "New farms · 1" (Santos Family Farm,
        owner Maria Santos).
      - Reject with an empty reason: the dialog stays open, focus is on the
        input labelled "What should they fix?", and its validation message
        is set. A reason of three spaces is blocked the same way.
      - Approve Juan in the UI: the card is removed ("New accounts · 0") and
        the row reads `approved` with `reviewed_by` set.
      - Reject Santos Family Farm in the UI with a reason: the row reads
        `rejected` with that reason. Approve Reyes Garden in the UI; its
        owner lists Talong (201), and Browse shows "Talong · Reyes Garden".
      - Both queues empty: two "Nobody is waiting" states.
      - Signed in as `buyerlocal`: "This page does not exist". Signed out:
        the sign-in `EmptyState`.
      - After review, on 800ms latency, first seen failing, then fixed:
        submitting a reason twice at once sent two requests and showed
        "already been reviewed" for a rejection that went through; it now
        sends one and shows no error. After an approval the card was still
        on screen when the dialog closed; now it is gone by then.

### Step 3.4 — The entry point, and the new farm state

- [x] **Action.** In `pages/AccountPage.tsx`:
      - Add `rejected: { label: 'Not approved', tone: 'stopped' }` to
        `FARM_STATUS`.
      - For `user.isAdmin`, a secondary `Button` above Sign out: **"Review
        sign-ups"** linking to `/admin`, with the combined pending count
        (`meta.total` of both lists) when it is above zero, e.g.
        "Review sign-ups · 4".

      In `pages/SellPage.tsx`, add a **rejected farm** state *before* the
      live-farm branch. Without it a rejected farm falls through to "Your farm
      is live", which is false. For now: `EmptyState`, title "Your farm was
      not approved", and `user.vendor.reviewNote` quoted as the description.
      Phase 5 adds the way to fix it. Update the component's doc comment,
      which counts the states.
- [x] **Verify.** `npm run typecheck && npm run lint && npm test` all pass.
      Screenshot Account as an admin and Sell with a rejected farm, at 390px.

      *Result, 2026-09-29:* typecheck and lint clean; backend 23 tests and
      frontend 46 tests pass. Account as the admin shows **"Review sign-ups
      · 2"** with one account and one farm waiting. Sell for the rejected
      Santos Family Farm shows "Your farm was not approved" and the reason
      in quotes, not "Your farm is live"; its Account screen shows the farm
      with a "Not approved" pill.

### Step 3.5 — Ship release 1

> **Now the single deploy for the whole plan** (see
> [Deployment sequencing](#deployment-sequencing--one-release)). The owner's
> steps, in order:
>
> 1. A production admin exists: the owner's account on Supabase has
>    `is_admin = true`. It predates the migration, so it is approved.
> 2. Apply the migration to Supabase (below), **then** merge the pull
>    request.
> 3. As soon as Vercel is live, open `/admin` and approve the accounts that
>    signed up between the migration and the merge. Until then those people
>    can browse and fill a basket but not order.
> 4. Wait for Render to show **Live**, then run this step's Verify **and**
>    step 6.3's Verify on the live site.

- [ ] **Action.**
      1. Update `docs/reference/api.md` (a new **Admin** section; `/me`'s new
         fields) and `docs/reference/data-model.md` (the new columns, the
         `account_approval_status` enum, `vendor_status` gaining `rejected`).
      2. `npm run typecheck && npm run lint && npm test && npm run docs:check`.
      3. Open the pull request. **The owner** then:
         - makes sure a production admin exists: their own account on
           Supabase with `is_admin = true`. Without one, nobody can clear the
           queue.
         - applies the migration to Supabase **before** merging
           ([deployments](../reference/deployments.md#two-things-the-free-tier-makes-manual)):

           ```powershell
           $env:DATABASE_URL = "<the session pooler URI>"
           npm --prefix backend run db:migrate
           ```
         - merges, and waits for Render to show **Live**.
- [ ] **Verify.** On the live site: the admin signs in and opens `/admin`; an
      account created before release 1 has `approval.status = "approved"` in
      `/me`; a fresh sign-up appears in the queue. Record the date here.

      *Progress, 2026-09-29:* actions 1 and 2 are done — `api.md` has an
      Admin section and `/me`'s new fields, `data-model.md` has the new
      columns and enums, and all four checks pass. The pull request and
      everything after it are the owner's: the Action box stays open until
      the pull request is opened, and the Verify until the live check.

---

## Phase 4 — Enforcement API (release 2 starts)

### Step 4.1 — `requireApprovedAccount`

- [x] **Action.** In `backend/src/middleware/require-auth.ts`, beside
      `requireAdmin`:

      ```ts
      /**
       * The caller's own account has been approved (ADR 0020).
       *
       * Middleware rather than a service check: it is a property of the caller,
       * like suspension and admin, not of the record being touched, and
       * requireAuth has already loaded the row. Runs after requireAuth.
       */
      export const requireApprovedAccount: RequestHandler = (req, _res, next) => {
        const status = req.user?.approvalStatus;
        if (status === 'approved') { next(); return; }
        next(AppError.forbidden(
          status === 'rejected'
            ? 'Your account was not approved. Update your details to send it for review again.'
            : 'We are still checking your account. You can do this once it is approved.',
        ));
      };
      ```

      Apply it after `requireAuth` on exactly: `POST /orders`,
      `POST /vendors/register`, `POST /products`. Nothing else. Reading your
      own orders, `/me`, and browsing stay open.
- [x] **Verify.** With a `pending` account's cookies, each of the three
      answers **403** with the pending message. After approving it through
      `/admin/accounts/:id/review`, the same order succeeds with **201**.
      `GET /products` and `GET /me` answer 200 throughout.

      *Result, 2026-09-29:* a new account got 403 "We are still checking
      your account…" from all three. `GET /products`, `GET /me` and
      `GET /orders` answered 200. After approval, the same order returned
      201. A rejected account gets 403 "Your account was not approved.
      Update your details…".

### Step 4.2 — `PATCH /me`: correct and resubmit

- [x] **Action.**
      - `auth.schema.ts`: `export const updateDetailsBody =
        registerBody.omit({ username: true, password: true });`. One source
        for the rules on both.
      - `auth.service.ts`: `updateOwnDetails(user, input)`. Allowed only when
        `approval_status` is `pending` or `rejected`. Otherwise
        `AppError.conflict('Your details cannot be changed here yet.')`.
        Resolve geography with `resolveMunicipalityBarangay`, write the
        fields, and if the account was `rejected`, set it to `pending` and
        clear `review_note`. Return the updated row.
      - `me.routes.ts`: `meRouter.patch('/', requireAuth, writeLimiter, …)`
        answering `{ data: await currentUser(updated) }`.
      *Done 2026-09-29.* The status check is also part of the update's
      condition (`approval_status in ('pending','rejected')`), as in 2.4, so
      an approval landing at the same moment is never turned back into
      `pending`. An email left out is kept, not cleared: the app has no
      email field, so the edit screen never sends one. `reviewed_at` and
      `reviewed_by` are left as they were: the step clears only the note.
- [x] **Verify.** A rejected account's `PATCH /me` answers 200 with
      `approval: { status: "pending", note: null }` and reappears in
      `/admin/accounts`. An approved account's `PATCH /me` answers 409. A
      barangay from the wrong municipality answers 400.

      *Result, 2026-09-29:* the rejected `s4rejected` answered 200 with
      `"approval":{"status":"pending","note":null}` and was back in
      `/admin/accounts`. An approved account answered 409 "Your details
      cannot be changed here yet." Naval with `talahid` answered 400
      `Barangay "talahid" is not in Naval`.

### Step 4.3 — `GET` and `PATCH /vendors/mine`: resubmit a farm

- [x] **Action.** In the vendors module:
      - `GET /vendors/mine` (`requireAuth`) → the caller's own farm as
        `OwnFarm`. Add it to `contracts/vendors.ts`: `VendorDetail &
        { municipalitySlug: string; barangaySlug: string; reviewNote: string
        | null }`. 404 if they have no farm.
      - `PATCH /vendors/mine` (`requireAuth`, `requireApprovedAccount`,
        `writeLimiter`) with `registerVendorBody`. Allowed only when the
        farm is `pending` or `rejected` (else 409). A rejected farm returns to
        `pending` with `review_note` cleared. Answers `OwnFarm`.
      - Declare both **before** any `/:id` route if one is ever added.
      *Done 2026-09-29.* The same conditional update as 4.2.
- [x] **Verify.** Reject a farm through the admin API. `GET /vendors/mine`
      shows the note. `PATCH /vendors/mine` returns it to `pending`, and it
      reappears in `/admin/farms`.

      *Result, 2026-09-29:* "Hilltop Greens" was rejected with a reason, and
      `GET /vendors/mine` showed `"status":"rejected"` with that
      `reviewNote`. `PATCH /vendors/mine` with a landmark answered 200,
      `"status":"pending","reviewNote":null`, and the farm was back in
      `/admin/farms`. Also checked: once approved, `PATCH` answers 409; no
      farm, `GET` answers 404; a pending account's `PATCH` answers 403.

---

## Phase 5 — The applicant's screens

The person on the other end may never have used an app like this before
([ADR 0016](../decisions/0016-the-interface-assumes-no-app-literacy.md)).
Every blocked state says **what is true now** and **what happens next**, and
never leaves them with a button that does nothing.

### Step 5.1 — `AccountReviewNotice`

- [x] **Action.** `frontend/src/features/auth/AccountReviewNotice.tsx`:
      props `{ approval: CurrentUser['approval']; blocked: 'order' | 'sell' }`.
      A panel, not an error: `bg-warn-soft` for pending and `bg-danger-soft`
      for rejected, with an icon **and** words. Colour never carries it
      alone.

      | State | Title | Body |
      |---|---|---|
      | pending, order | We are checking your account | You can place this order once it is approved. Your basket is saved on this phone. |
      | pending, sell | We are checking your account | Once your account is approved you can register your farm. |
      | rejected, either | Your account was not approved | The reason, quoted, then a primary button **"Fix my details"** → `/account/edit` |

      The pending state also has a quiet **"Check again"** button that
      refetches `/me`. The app sets `refetchOnWindowFocus: false` to save
      metered data (`lib/query-client.ts`) and `/me` is stale only after 60
      seconds, so someone approved while looking at this screen would
      otherwise see no change. One request, only when tapped.

      Keep the copy selection out of the component: a pure
      `approvalCopy(status, blocked)` in
      `frontend/src/features/auth/approval-copy.ts`. Map state to whole class
      names; never interpolate one.

      *Done 2026-09-29.* The rejected row's body is copy, not the reason:
      "Fix your details and send them for review again." The component
      quotes the admin's reason above it, so the pure function takes no
      data.
- [x] **Verify.** `approval-copy.test.ts` beside it (vitest picks up
      `src/**/*.test.ts`), written first, covering all three rows, passes.

      *Result:* before the module existed, the file failed to import
      `./approval-copy`. After, 3 tests pass.

### Step 5.2 — Basket, Sell, Account

- [x] **Action.**
      - `CartPage.tsx`: signed in and `approval.status !== 'approved'` →
        render `AccountReviewNotice blocked="order"` **in place of** the
        place-order button. The basket, totals and "Empty the basket" stay.
      - `SellPage.tsx`: after the signed-out branch and **before** the
        no-farm branch, an unapproved account gets
        `AccountReviewNotice blocked="sell"`. The rejected-farm state from
        3.4 gains a primary **"Fix my farm details"** →
        `/sell/register`.
      - `AccountPage.tsx`: an **"Account"** row in the `dl` with a
        `StatusPill`: `waiting` "Being checked", `active` "Approved",
        `stopped` "Not approved". When rejected, the reason and a
        **"Fix my details"** link.

      *Done 2026-09-29, ruling flagged:* a **pending** account's row also
      links to `/account/edit`, as "Change my details". Step 5.4 gives the
      page a pending mode ("Save"), and without a link nothing reaches it.
      The link has a 48px tap target. An account that is not approved gets
      the Sell notice even if it has a farm: someone who registered one
      during release 1, while pending, is told about the account first,
      because the farm cannot be approved before it (step 2.4).
- [x] **Verify.** Signed in as a pending account: Basket shows the notice and
      no order button; Sell shows the notice and no "Register my farm". After
      approval in another browser, tapping **"Check again"** brings both back
      to normal without signing out. Screenshot each state at 390px.

      *Result, 2026-09-29, at 390px:* for pending `s5pending` with a seeded
      basket, Basket shows the basket, the total and "We are checking your
      account" with "Check again", and no order button. Sell shows the
      notice and no "Register my farm". Account shows "Being checked". For
      rejected `s5rejected`: the reason quoted and "Fix my details" on all
      three. With `s5pending` on the Basket, the account was approved
      through the API in the background. "Check again" then brought back
      "Place order" and removed the notice. Sell, reached through the
      bottom bar in the same session, showed "Register my farm". No sign-out.

### Step 5.3 — Extract the name and address fields

- [x] **Action.** `RegisterPage.tsx` holds the "Your name" and "Where you
      live" sections inline, and `/account/edit` needs exactly the same
      fields. Move them into `frontend/src/features/auth/NameFields.tsx` and
      `HomeFields.tsx`. Each is controlled: it takes its values and an
      `onChange` from the parent. The municipality/barangay coupling (the
      barangay is disabled until a municipality is chosen, and changing the
      municipality clears it) moves with `HomeFields`. **Registration must
      behave identically.**
- [x] **Verify.** Screenshot `/register` at 390px before and after: visually
      identical. Submitting an empty last name still focuses it. A taken
      username still lands on the username field.

      *Result, 2026-09-29:* the full-length `/register` screenshot is
      byte-identical before and after. The same scripted runs, before and
      after, gave the same results. With every field but the last name
      filled, submit leaves focus on the last name with "Please fill out
      this field." With `adminlocal` as the username, "already taken" shows
      under the username field. Focus does not move there, before or after.

### Step 5.4 — `/account/edit`

- [x] **Action.** `frontend/src/pages/AccountEditPage.tsx` at
      `/account/edit`, plus `useUpdateDetails()` in `features/auth/api.ts`,
      which writes the response into `authKeys.me` on success. The page
      composes `NameFields`, `HomeFields` and the phone field, and when
      rejected shows the reason at the top. Submit: **"Send for review
      again"** when rejected, **"Save"** when pending.

      Prefill: render the form in a child component only once `/me` has
      loaded, and seed its `useState` from `user` **once**. The form holds
      the person's draft, not a mirror of server state. Only reachable while
      pending or rejected. An approved account is redirected to `/account`.
      Add `'/account/edit': 'Your details'` to `TITLES`.

      *Done 2026-09-29.* The phone sits in its own "How to reach you"
      section, with registration's label and hint. It is prefilled in the
      local format (`0919 555 0808`), which the API accepts. There is no
      email field, as in registration. Signed out, the page shows the
      sign-in `EmptyState` with `next=/account/edit`.
- [x] **Verify.** As a rejected account: fix the address, submit, land on
      `/account` showing "Being checked", and the account is back in the
      admin queue. Screenshot at 390px.

      *Result, 2026-09-29:* for `s5rejected` the form was prefilled (name,
      `0919 555 0808`, Naval / Atipolo, "By the school"), with the reason
      at the top and "Send for review again". Changing the barangay to
      Caraycaray and sending landed on `/account` showing "Being checked"
      and "Caraycaray, Naval". The row reads `pending` with no reason, and
      the account is back in `/admin/accounts`. An approved account
      opening `/account/edit` ends on `/account`.

### Step 5.5 — Resubmit a farm

- [x] **Action.** `VendorRegisterPage.tsx`: when `user.vendor?.status ===
      'rejected'`, load `GET /vendors/mine` (`useMyFarm()` in
      `features/vendors/api.ts`), prefill as in 5.4, show the reason at the
      top, and submit to `PATCH /vendors/mine` with **"Send for review
      again"**. The new-farm path is unchanged.

      *Done 2026-09-29.* One change to the new-farm path: it waits for
      `/me`, with "Checking your account", before showing the form. The form
      is seeded once, so it has to know which farm it is for. `/me` is
      almost always cached from the Sell screen, so this rarely shows.
      `useUpdateMyFarm` returns its `/me` invalidation, so Sell already
      reads "We are checking your farm" when it arrives.
- [x] **Verify.** A rejected farm is fixed, resubmitted, shows "We are
      checking your farm" on Sell, and is back in `/admin`.

      *Result, 2026-09-29:* "Riverside Pechay" was rejected with "Please add
      a landmark buyers can find". Sell showed the reason and "Fix my farm
      details", which opened `/sell/register` prefilled with the reason at
      the top and "Send for review again". Adding a landmark and sending
      landed on Sell with "We are checking your farm". The row reads
      `pending`, with the landmark and no reason, and the farm is in
      `/admin/farms`.

---

## Phase 6 — Docs and release 2

### Step 6.1 — Update what now reads false

- [x] **Action.**
      - `docs/reference/api.md`: `PATCH /me`, `GET`/`PATCH /vendors/mine`, and
        which routes need an approved account.
      - `docs/reference/commands.md` and
        `docs/getting-started/local-setup.md`: replace "approving is a SQL
        update until plan 0003 ships" with the admin screen. The local smoke
        test now needs the **account** approved before registering a farm.
        Show the SQL shortcut for local use only:
        `update users set approval_status='approved' where username='…';`.
      - `docs/explanation/constraints.md` §5: add *"Every account is reviewed
        before it can order"* linking ADR 0020, beside the vendor bullet.
      - `docs/decisions/0020-…`: status **Accepted**.
        `docs/decisions/README.md`: the log row too.
      - `docs/decisions/0011-…`: under Status, add
        `- **Extended by:** [ADR 0020](./0020-every-account-is-reviewed-before-it-can-order.md)`
        and replace the last paragraph ("There is no approval endpoint yet…")
        with one line saying the queue is at `/admin`.

      *Done 2026-09-29.* `api.md` marks the gated routes **approved**,
      defined under Conventions, and drops the Admin section's "nothing
      refuses a pending account yet". ADR 0011's new last line also says a
      farm is approved only once its owner's account is (step 2.4).
- [x] **Verify.** `npm run docs:check` passes.

      *Result:* 49 files, 198 links resolve; plan checks pass. No
      "SQL update until plan 0003" remains outside this plan.

### Step 6.2 — Check the whole thing, as each person

- [x] **Action.** On a freshly reset local database, walk it end to end:
      1. A visitor fills a basket, registers, returns to the basket: sees
         "We are checking your account", basket intact.
      2. The admin rejects them with "Barangay does not match your address".
      3. They see the reason, fix it, resubmit. They are back in the queue.
      4. The admin approves. They place the order.
      5. They register a farm. The admin rejects it, they fix it, the admin
         approves it, and they list produce, which appears in Browse.
- [x] **Verify.** Every step behaves as written.
      `npm run typecheck && npm run lint && npm test && npm run docs:check`
      all pass. Screenshots at 390px of every new state are attached to the
      pull request.

      *Result, 2026-09-29.* Local database reset with `npm run db:reset`,
      then migrated and seeded. `adminlocal` was made admin by SQL. An
      approved farm, Reyes Garden, listed Talong for the basket. Everything
      from here was done on the screens, at 390px, apart from listing
      produce, which has no screen yet:
      1. With Talong in the basket, `rosabuyer` registered from
         `/register?next=/cart`. She landed on the Basket: Talong, ₱120.00,
         "We are checking your account", no order button.
      2. The admin rejected her on `/admin` with "Barangay does not match
         your address". The row reads `rejected` with that reason.
      3. Her Basket quoted the reason, basket intact. "Fix my details" led
         to `/account/edit`. She changed the barangay and sent it again,
         landing on Account with "Being checked". She was back in
         `/admin/accounts`.
      4. The admin approved her on `/admin`. Her Basket showed no notice.
         "Place order" landed on `/orders` with the Reyes Garden order, one
         row in `orders`.
      5. She registered "Santos Pechay" and Sell read "We are checking your
         farm". On `/admin` the card showed "Account approved". The admin
         rejected it with a reason. Sell quoted it, and "Fix my farm
         details" let her add a landmark and send it again. The admin
         approved it. She listed Pechay (201), and Browse shows "Pechay ·
         Santos Pechay" beside Talong.

      The four checks pass: backend 23 tests, frontend 49. The PR is the
      owner's to open (6.3), so the screenshots are handed over to attach.
      The first run of this walk was thrown off by the screenshot script:
      PowerShell mangled one button label's "·", and Edge once failed to
      start. It was rerun from another reset. On that rerun, two checks
      fired before the page had drawn (right after registering, and the
      final farm approval). Their screenshots show the expected screen. The
      approval was repeated with a longer wait and passed.

### Step 6.3 — Ship release 2

> **Superseded by step 3.5**: the plan ships as one release (see
> [Deployment sequencing](#deployment-sequencing--one-release)). There is no
> second pull request and no queue to empty beforehand. This step's Verify is
> run on the live site as part of 3.5; tick it there.

- [ ] **Action.** Open the pull request. **Before it is merged, the owner
      works the production queue to empty**, so nobody who signed up
      during release 1 is blocked by the deploy. Then merge, and wait for
      Render to show **Live**. No migration.
- [ ] **Verify.** On the live site: a new sign-up cannot place an order and
      is told why; after approval in `/admin`, it can. Record the date,
      set this plan's status to **Complete** and the index row in
      `docs/plans/README.md` to match.

---

## Acceptance

The plan is complete when every box below is checked.

- [ ] Every account that existed before release 1 is `approved`
- [x] A new account is `pending`; it can sign in, browse and fill a basket
- [x] A pending or rejected account gets 403 from placing an order,
      registering a farm, and listing produce, with a message that says why
- [x] An admin sees pending accounts and farms, oldest first, and nobody else
      can: 401 signed out, 403 for a non-admin, on every admin route
- [x] Rejecting requires a reason; the person sees it and can resubmit
- [x] Two reviews of the same row: one succeeds, the other is a 409
- [x] "Register my farm" is unreachable until the account is approved
- [x] A rejected farm is shown as not approved, never as live
- [x] The home address appears only in `CurrentUser` and `PendingAccount`
- [x] Every new screen is checked at 390px
- [x] `npm run typecheck && npm run lint && npm test && npm run docs:check`
- [ ] The migration was applied to Supabase **before** the merge
- [ ] Accounts that signed up between the migration and the merge were approved in `/admin` right after it
- [x] ADR 0020 is Accepted

*2026-09-29:* the ticked boxes were checked locally. All four admin routes
answer 401 signed out and 403 to a non-admin. The contracts carry
`addressDetail` only in `CurrentUser` and `PendingAccount`. The three still
open are the owner's, on production: step 3.5's live check, the release 1
migration, and the empty queue before release 2.

## Follow-ups

- **Tell people they were approved.** Needs the SMS channel deferred in
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md).
  Until then the queue must be worked daily. ADR 0020 says why
- A profile editor for approved accounts (carried from plan 0006)
- Suspending an account or a farm from `/admin`, instead of by SQL
- Review history, if the owner wants to see who was rejected before
- Waray/Filipino copy for the new states
- Measure sign-up → first order. If it is poor, ADR 0020 names the first thing
  to revisit
