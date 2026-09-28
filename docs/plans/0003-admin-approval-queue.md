# 0003. Admin approval queue — accounts and farms

- **Status:** Ready
- **Owner:** unassigned
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
   may not have. See [Deployment sequencing](#deployment-sequencing--two-releases).

## Blockers

None to start. Release 1 cannot ship until **a production admin account
exists** — see step 3.5.

## Deployment sequencing — two releases

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
| 1. Schema | 0 / 3 | Not started |
| 2. Admin API | 0 / 5 | Not started |
| 3. Admin screen — release 1 ships | 0 / 5 | Not started |
| 4. Enforcement API | 0 / 3 | Not started |
| 5. The applicant's screens | 0 / 5 | Not started |
| 6. Docs and release 2 | 0 / 3 | Not started |

---

## Phase 1 — Schema

### Step 1.1 — Add the columns

- [ ] **Action.** In `backend/src/db/schema/enums.ts`:

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
- [ ] **Verify.** `npm --prefix backend run typecheck` passes.

### Step 1.2 — Generate, then hand-edit the migration

- [ ] **Action.** `npm --prefix backend run db:generate -- --name approval_review`
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
- [ ] **Verify.** On a database that already holds the two prerequisite
      accounts:

      ```bash
      npm run db:migrate
      docker exec ani-postgres psql -U ani -d ani \
        -c "select username, approval_status from users;"
      ```

      Both existing accounts read `approved`. Then register a third account
      and re-run the query: it reads `pending`.

### Step 1.3 — Rehearse the window

- [ ] **Action.** Prove the **old** code works against the **new** schema,
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
- [ ] **Verify.** Step 5: every call succeeds. Step 6: the accounts from
      step 3 read `approved`, and the one registered in step 5 reads
      `pending`. Write the result in this step, as plan 0006 did.

---

## Phase 2 — Admin API

Copy the shape of `backend/src/modules/vendors/` for the module, and
`ALLOWED_TRANSITIONS` in `modules/orders/orders.service.ts` for how a legal
move is expressed.

### Step 2.1 — Contracts

- [ ] **Action.** Create `backend/src/contracts/admin.ts`. No Drizzle types
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
- [ ] **Verify.** `npm run typecheck`. It **fails** in
      `frontend/src/pages/AccountPage.tsx` (`FARM_STATUS` is missing
      `rejected`) and in `auth.service.ts` (`currentUser` is missing fields).
      That is the contract doing its job. Both are fixed in steps 2.2 and 3.4.

### Step 2.2 — `currentUser` returns the new fields

- [ ] **Action.** In `backend/src/modules/auth/auth.service.ts`,
      `currentUser()` returns `approval: { status: user.approvalStatus, note:
      user.reviewNote }`, the two slugs inside `home`, and `reviewNote` on
      `vendor`.
- [ ] **Verify.** `curl -s -b /tmp/ani-buyer localhost:4000/api/v1/me`
      includes `"approval":{"status":"approved","note":null}` for a
      pre-migration account and `"pending"` for a new one.

### Step 2.3 — The review body, tested first

- [ ] **Action.** Create `backend/src/modules/admin/admin.schema.ts`:

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
- [ ] **Verify.** `npm --prefix backend test` — the new tests fail before the
      schema exists and pass after.

### Step 2.4 — The service

- [ ] **Action.** `backend/src/modules/admin/admin.service.ts`:

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
- [ ] **Verify.** `npm --prefix backend run typecheck && npm --prefix backend run lint`.

### Step 2.5 — Routes, mounted behind admin

- [ ] **Action.** `backend/src/modules/admin/admin.routes.ts`:

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
- [ ] **Verify.**

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

---

## Phase 3 — Admin screen (release 1 ships at the end)

Read [`frontend/DESIGN.md`](../../frontend/DESIGN.md) and
[add a UI component](../guides/add-a-ui-component.md) first. Tokens only.
`StatusPill` for status, `EmptyState` for an empty queue, `ConfirmDialog` for
both actions.

### Step 3.1 — Feature data layer

- [ ] **Action.** `frontend/src/features/admin/types.ts` re-exports the
      contracts from `@contracts/admin`. `frontend/src/features/admin/api.ts`,
      following `features/vendors/api.ts`: an `adminKeys` factory,
      `usePendingAccounts()`, `usePendingFarms()`, `useReviewAccount()`,
      `useReviewFarm()`. The two list hooks take an `enabled` flag, so the
      Account screen fetches them only for an admin. On success a review
      mutation invalidates its own list, which also refreshes the count on the
      Account button (step 3.4).
- [ ] **Verify.** `npm --prefix frontend run typecheck` passes (apart from
      `FARM_STATUS`, fixed in 3.4).

### Step 3.2 — A slot in `ConfirmDialog`

- [ ] **Action.** Rejecting needs a reason typed inside the dialog.
      `ConfirmDialog` has no slot for one. Add an optional `children` prop,
      rendered between the description and the buttons, and nothing else.
      Every existing caller is unchanged.
- [ ] **Verify.** The Cart and Account dialogs look identical before and
      after: screenshot both at 390px.

### Step 3.3 — The queue

- [ ] **Action.** Feature components in `frontend/src/features/admin/`, each
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
- [ ] **Verify.** Approving in the UI removes the card and its produce, once
      listed, appears in Browse. Rejecting without a reason is blocked by the
      browser with focus on the field. Screenshot `/admin` at 390px with one
      card of each kind, and empty. Signed in as `buyerlocal`, `/admin` shows
      Not found.

### Step 3.4 — The entry point, and the new farm state

- [ ] **Action.** In `pages/AccountPage.tsx`:
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
- [ ] **Verify.** `npm run typecheck && npm run lint && npm test` all pass.
      Screenshot Account as an admin and Sell with a rejected farm, at 390px.

### Step 3.5 — Ship release 1

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

---

## Phase 4 — Enforcement API (release 2 starts)

### Step 4.1 — `requireApprovedAccount`

- [ ] **Action.** In `backend/src/middleware/require-auth.ts`, beside
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
- [ ] **Verify.** With a `pending` account's cookies, each of the three
      answers **403** with the pending message. After approving it through
      `/admin/accounts/:id/review`, the same order succeeds with **201**.
      `GET /products` and `GET /me` answer 200 throughout.

### Step 4.2 — `PATCH /me`: correct and resubmit

- [ ] **Action.**
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
- [ ] **Verify.** A rejected account's `PATCH /me` answers 200 with
      `approval: { status: "pending", note: null }` and reappears in
      `/admin/accounts`. An approved account's `PATCH /me` answers 409. A
      barangay from the wrong municipality answers 400.

### Step 4.3 — `GET` and `PATCH /vendors/mine`: resubmit a farm

- [ ] **Action.** In the vendors module:
      - `GET /vendors/mine` (`requireAuth`) → the caller's own farm as
        `OwnFarm`. Add it to `contracts/vendors.ts`: `VendorDetail &
        { municipalitySlug: string; barangaySlug: string; reviewNote: string
        | null }`. 404 if they have no farm.
      - `PATCH /vendors/mine` (`requireAuth`, `requireApprovedAccount`,
        `writeLimiter`) with `registerVendorBody`. Allowed only when the
        farm is `pending` or `rejected` (else 409). A rejected farm returns to
        `pending` with `review_note` cleared. Answers `OwnFarm`.
      - Declare both **before** any `/:id` route if one is ever added.
- [ ] **Verify.** Reject a farm through the admin API. `GET /vendors/mine`
      shows the note. `PATCH /vendors/mine` returns it to `pending`, and it
      reappears in `/admin/farms`.

---

## Phase 5 — The applicant's screens

The person on the other end may never have used an app like this before
([ADR 0016](../decisions/0016-the-interface-assumes-no-app-literacy.md)).
Every blocked state says **what is true now** and **what happens next**, and
never leaves them with a button that does nothing.

### Step 5.1 — `AccountReviewNotice`

- [ ] **Action.** `frontend/src/features/auth/AccountReviewNotice.tsx`:
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
- [ ] **Verify.** `approval-copy.test.ts` beside it (vitest picks up
      `src/**/*.test.ts`), written first, covering all three rows, passes.

### Step 5.2 — Basket, Sell, Account

- [ ] **Action.**
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
- [ ] **Verify.** Signed in as a pending account: Basket shows the notice and
      no order button; Sell shows the notice and no "Register my farm". After
      approval in another browser, tapping **"Check again"** brings both back
      to normal without signing out. Screenshot each state at 390px.

### Step 5.3 — Extract the name and address fields

- [ ] **Action.** `RegisterPage.tsx` holds the "Your name" and "Where you
      live" sections inline, and `/account/edit` needs exactly the same
      fields. Move them into `frontend/src/features/auth/NameFields.tsx` and
      `HomeFields.tsx`. Each is controlled: it takes its values and an
      `onChange` from the parent. The municipality/barangay coupling (the
      barangay is disabled until a municipality is chosen, and changing the
      municipality clears it) moves with `HomeFields`. **Registration must
      behave identically.**
- [ ] **Verify.** Screenshot `/register` at 390px before and after: visually
      identical. Submitting an empty last name still focuses it. A taken
      username still lands on the username field.

### Step 5.4 — `/account/edit`

- [ ] **Action.** `frontend/src/pages/AccountEditPage.tsx` at
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
- [ ] **Verify.** As a rejected account: fix the address, submit, land on
      `/account` showing "Being checked", and the account is back in the
      admin queue. Screenshot at 390px.

### Step 5.5 — Resubmit a farm

- [ ] **Action.** `VendorRegisterPage.tsx`: when `user.vendor?.status ===
      'rejected'`, load `GET /vendors/mine` (`useMyFarm()` in
      `features/vendors/api.ts`), prefill as in 5.4, show the reason at the
      top, and submit to `PATCH /vendors/mine` with **"Send for review
      again"**. The new-farm path is unchanged.
- [ ] **Verify.** A rejected farm is fixed, resubmitted, shows "We are
      checking your farm" on Sell, and is back in `/admin`.

---

## Phase 6 — Docs and release 2

### Step 6.1 — Update what now reads false

- [ ] **Action.**
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
- [ ] **Verify.** `npm run docs:check` passes.

### Step 6.2 — Check the whole thing, as each person

- [ ] **Action.** On a freshly reset local database, walk it end to end:
      1. A visitor fills a basket, registers, returns to the basket: sees
         "We are checking your account", basket intact.
      2. The admin rejects them with "Barangay does not match your address".
      3. They see the reason, fix it, resubmit. They are back in the queue.
      4. The admin approves. They place the order.
      5. They register a farm. The admin rejects it, they fix it, the admin
         approves it, and they list produce, which appears in Browse.
- [ ] **Verify.** Every step behaves as written.
      `npm run typecheck && npm run lint && npm test && npm run docs:check`
      all pass. Screenshots at 390px of every new state are attached to the
      pull request.

### Step 6.3 — Ship release 2

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
- [ ] A new account is `pending`; it can sign in, browse and fill a basket
- [ ] A pending or rejected account gets 403 from placing an order,
      registering a farm, and listing produce, with a message that says why
- [ ] An admin sees pending accounts and farms, oldest first, and nobody else
      can: 401 signed out, 403 for a non-admin, on every admin route
- [ ] Rejecting requires a reason; the person sees it and can resubmit
- [ ] Two reviews of the same row: one succeeds, the other is a 409
- [ ] "Register my farm" is unreachable until the account is approved
- [ ] A rejected farm is shown as not approved, never as live
- [ ] The home address appears only in `CurrentUser` and `PendingAccount`
- [ ] Every new screen is checked at 390px
- [ ] `npm run typecheck && npm run lint && npm test && npm run docs:check`
- [ ] Release 1: the migration was applied to Supabase **before** its merge
- [ ] Release 2: the production queue was empty **before** its merge
- [ ] ADR 0020 is Accepted

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
