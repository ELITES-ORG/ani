# Handoff: #7 — Finish putting Ani live: complete the Vercel deploy and the approval-queue release

STATUS: READY.
Written for: whoever builds #7, with no memory of earlier conversations.
Based on `main` at commit `0da686a99379e2f24a99132c7646cc145624e2c8`, 2026-10-25.

## 0. The pull requests, and when to stop

| Order | Branch | Title | What goes in it |
|---|---|---|---|
| PR 1 | `docs/7-complete-live-rollout` | Record that the live site and the approval queue are finished | Steps 6.1–6.6 |

- Build the pull requests in this order, one at a time.
- Start each one on a fresh branch from the latest `main`:
  `git fetch origin` then `git switch -c docs/7-complete-live-rollout origin/main`.
- Do that only after step 6.1's report is in your hands. Section C is the owner's work. You do not do it.
- After you open each pull request, STOP. Send your report (section 7) and wait. There is no second pull request.

## 1. What you are building

You are recording that two rollouts already shipped in code are finished on the live site. Plan 0001's public site is https://ani-staging-blrn.vercel.app, the API is https://ani-api-njg8.onrender.com, and plan 0003's approval queue is the `/admin` screen that merged in #6. The owner confirms the live checks in section C, including session reload, the approval queue, one test order, a farm submission, and Chrome on Android's install offer. You then update the two plan files and `docs/plans/README.md` so 0001 and 0003 read as complete. Plan 0001 phase 4 (keep-awake) stays deferred, and its acceptance box stays unticked. No application code changes.

## 2. Decisions already made — final

Decided by reyxdz on 2026-10-23, 2026-10-24, and 2026-10-25. Do not change these. Do not ask about them again.

| Topic | Decision |
|---|---|
| One issue for both rollouts | Yes. Both are owner dashboard steps, and plan 0003's live check needs the Vercel site from plan 0001. *(technical call, recorded in the issue on 2026-10-24)* |
| Pull requests | One pull request into `main`, for the plan status changes. Dashboard work stays with the owner. |
| Migration applied before #6 | Tick the acceptance box "The migration was applied to Supabase **before** the merge" only when the owner is sure it ran before #6 merged. If the column was missing, the owner applies the migration now. If they are not sure, or they apply it now, leave that acceptance box unticked, write the dated note in step 6.3, and still set plan 0003's status to `Complete`. |
| Keep-awake acceptance box | Leave "Keep-awake deliberately left off, and the reason understood" unticked. Phase 4 stays deferred and its own steps stay unticked. |
| Plan 0001 status line | `Complete, except phase 4 (keep-awake), which stays deferred`. A bare `Complete` fails `npm run docs:check` while phase 4 is `0 / 2` and deferred. The index row stays `Complete`, which is the text before the comma. *(technical call)* |
| Plan 0003 phase rows when the migration timing is unproven | Phase 3 is `4 / 5` with status `Done — 3.5 action remains open; migration was not proven before #6`. Step 3.5's Action stays unticked. Phase 6 is `2 / 3` with status `Done — 6.3 action superseded by 3.5; Verify done`. Step 6.3's Action stays unticked. Both wordings pass `npm run docs:check`. *(technical call)* |
| Plan 0003 phase rows when the owner is sure the migration ran before #6 | Phase 3 is `5 / 5` with status `Done`, and step 3.5's Action is ticked. Phase 6 stays as in the row above. *(technical call)* |
| Accounts that signed up between the migration and the merge | Tick that acceptance box when the owner reports the count was 0, and add the note `None.` Tick it when the count was greater than 0 and those accounts were approved in `/admin`, and add the note `Approved in /admin: <count>.` When the migration is applied only now, leave the box unticked: the migration's `DEFAULT 'approved'` approves every existing row, which is not an `/admin` approval. Add the note from step 6.3. *(technical call)* |
| Farm check | A pending account cannot register a farm. The owner approves the rollout-check account first. Sell then shows `We are checking your farm`. That is the shipped sentence. Tick plan 0001's farm acceptance box when the owner reports that sentence. *(technical call)* |
| Catalogue heading | The shipped empty catalogue heading is `No produce yet`. Tick plan 0001's catalogue acceptance box when the site loads, `/api/v1/products` returns 200 from the Vercel host, and the console has no errors. *(technical call)* |
| Order check | The basket notice appears only when the basket has an item. There is no add-produce screen. If the catalogue has no product on a farm the owner controls, the owner creates one with the `POST /api/v1/products` body in section C. *(technical call)* |
| What gets written down | Dates are `YYYY-MM-DD`. The plan and the pull request contain the date, the counts, the install-menu words, and the URLs. They do not contain usernames, passwords, phone numbers, addresses, or `DATABASE_URL`. *(technical call)* |
| Branch name | `docs/7-complete-live-rollout`. Merged pull requests do not share one naming pattern. *(technical call)* |
| API host | If the owner reports an API URL other than `https://ani-api-njg8.onrender.com`, stop and ask. Do not edit `frontend/vercel.json`. *(technical call)* |

## 3. Ground truth

Read from the code at commit `0da686a99379e2f24a99132c7646cc145624e2c8`. If what you see differs from any row, STOP and ask. Do not adapt.

| Fact | Where to find it | Value |
|---|---|---|
| Plan 0001 status | `docs/plans/0001-deployment.md`, search `- **Status:**` | `In progress` |
| Plan 0001 phase 3 | same file, search `3. Web` | `3 / 5` and `In progress` |
| Plan 0001 phase 4 | same file, search `Keep awake` | `0 / 2` and `**Deferred** — see the note in phase 4` |
| Plan 0001 live PWA URL | same file, search `ani-staging-blrn.vercel.app` | `https://ani-staging-blrn.vercel.app` |
| Plan 0001 live API URL | same file, search `ani-api-njg8.onrender.com` | `https://ani-api-njg8.onrender.com` |
| Plan 0003 status | `docs/plans/0003-admin-approval-queue.md`, search `- **Status:**` | `In progress` |
| Plan 0003 phase 3 | same file, search `3.5 outstanding` | `4 / 5` and `In progress; 3.5 outstanding — the owner's migration, merge and live check` |
| Plan 0003 phase 6 | same file, search `6.3 superseded` | `2 / 3` and `In progress; 6.3 superseded — folded into 3.5, one release; its live Verify is still outstanding` |
| Index rows | `docs/plans/README.md`, search `0001-deployment` and `0003-admin-approval-queue` | both `In progress` |
| Bare `Complete` rule | `scripts/check-plan-status.mjs`, search `CLAIMS_FINISHED` | only a status that is exactly `Complete` or `Done` claims every phase is finished |
| Index short form | same file, search `shortForm` | text before the first comma, semicolon, or ` —` |
| Phase exemption words | same file, search `EXEMPT` | includes `defer`, `supersed`, and `remains` |
| Box counting headings | same file, search `PHASE_HEADING` | boxes are counted under a heading `# Phase`. These plans use `## Phase`, so an unticked box does not fail the script. Tick the boxes this handoff names anyway |
| Deployed URL reference | `docs/reference/deployments.md`, search `ani-staging-blrn` | same PWA and API URLs as plan 0001 |
| Rewrite target | `frontend/vercel.json`, search `destination` | `https://ani-api-njg8.onrender.com/api/:path*` |
| Health body | `backend/src/modules/health/health.routes.ts`, search `database === 'up'` | HTTP 200 and `data.database` `up` when the query works; HTTP 503 and `down` when it throws |
| Session cookie note | `docs/reference/environment.md`, search `sameSite=lax` | `VITE_API_BASE_URL` left unset; setting it cross-origin breaks sign-in |
| CORS default | same file, search `CORS_ORIGINS` | default `http://localhost:5173`; production must list the Vercel URL |
| Migration file | `backend/drizzle/0003_approval_review.sql`, search `DEFAULT 'approved'` | adds `approval_status` as `NOT NULL DEFAULT 'approved'`, then sets the default to `pending` |
| Migration tag | `backend/drizzle/meta/_journal.json`, search `0003_approval_review` | `when` is `1790627162302` |
| Migrations table | `backend/node_modules/drizzle-orm/pg-core/dialect.js`, search `migrationsSchema` | schema `drizzle`, table `__drizzle_migrations`; `created_at` is the file's `when`, not the time it was applied |
| Admin column | `backend/src/db/schema/users.ts`, search `is_admin` | `is_admin` boolean, default false |
| Approval column | same file, search `approval_status` | `approval_status`, default `pending` in the schema. The migration's first default is `approved` |
| Self-review | `backend/src/modules/admin/admin.service.ts`, search `You cannot review your own account.` | `reviewAccount` returns 403 with that message when the admin id equals the user id |
| Admin gate | `backend/src/modules/admin/admin.routes.ts`, search `requireAdmin` | `requireAuth` and `requireAdmin`. It does not use `requireApprovedAccount` |
| Non-admin `/admin` | `frontend/src/pages/AdminPage.tsx`, search `NotFoundPage` | a signed-in non-admin sees the not-found page |
| Not-found title | `frontend/src/pages/NotFoundPage.tsx`, search `This page does not exist` | `This page does not exist` |
| Pending account copy | `frontend/src/features/auth/approval-copy.ts`, search `We are checking your account` | title `We are checking your account`; order body `You can place this order once it is approved. Your basket is saved on this phone.`; sell body `Once your account is approved you can register your farm.` |
| Account pill | `frontend/src/pages/AccountPage.tsx`, search `Being checked` | pending `Being checked`; approved `Approved` |
| Empty basket | `frontend/src/pages/CartPage.tsx`, search `Your basket is empty` | an empty basket returns before the approval notice |
| Order button | same file, search `Place order` | `Place order · pay on pickup`, shown when the account is approved and the basket has items |
| Farm pending title | `frontend/src/pages/SellPage.tsx`, search `We are checking your farm` | `We are checking your farm` |
| Register farm button | same file, search `Register my farm` | shown only when the account is approved and `vendor` is null |
| Farm submit | `frontend/src/pages/VendorRegisterPage.tsx`, search `Send for review` | `Send for review` |
| Empty catalogue | `frontend/src/pages/BrowsePage.tsx`, search `No produce yet` | `No produce yet` |
| Product body | `backend/src/modules/products/products.schema.ts`, search `createProductBody` | `name`, `category`, `pricePesos`, `stockAmount`, `unit`; `description` defaults to `""`; `imageUrls` defaults to `[]` |
| Product guards | `backend/src/modules/products/products.service.ts`, search `Register your farm before listing produce.` | 403 `Register your farm before listing produce.` when there is no farm; 403 `Your farm is still awaiting approval.` when the farm is not approved |
| Account-not-approved message | `backend/src/middleware/require-auth.ts`, search `We are still checking your account.` | 403 `We are still checking your account. You can do this once it is approved.` |
| Seed contents | `backend/src/db/seed/index.ts`, search `municipalities` | municipalities and barangays only. No products |
| Manifest | `frontend/public/manifest.webmanifest`, search `"display"` | `standalone`, with 192 and 512 icons |
| Approve control | `frontend/src/features/admin/AccountReviewCard.tsx`, search `Approve` | button `Approve`; the dialog confirm label in `ReviewDialog.tsx` is `Approve` |
| Queue headings | `frontend/src/pages/AdminPage.tsx`, search `New accounts` | `New accounts` and `New farms` |
| Account link | `frontend/src/components/AppHeader.tsx`, search `Your account` | the icon's accessible name is `Your account`, on tab routes, linking to `/account` |
| Register button | `frontend/src/pages/RegisterPage.tsx`, search `Create account` | `Create account`. Success navigates to `/` when the URL has no `next` |
| Migrate command | `docs/reference/deployments.md`, search `db:migrate` | PowerShell: set `DATABASE_URL` to the session pooler URI, then `npm --prefix backend run db:migrate` |
| Check scripts | `package.json`, search `"docs:check"` | `npm run typecheck`, `npm run lint`, `npm test`, `npm run docs:check` |
| CI | `.github/workflows/ci.yml`, search `npm run docs:check` | typecheck, lint, migrate, test, build, docs check, and the commit-message check |
| Pull request body check | `.github/workflows/ci.yml`, search `pull_request` | none. CI does not read the pull request body |
| #6 commit | `git log -1 --format=%H origin/main` | `0da686a99379e2f24a99132c7646cc145624e2c8`, subject `Feat/approval queue (#6)` |

## 4. The design

No new route, table, or screen. The pull request changes records of work that is already in `main`.

Limits: none — the ticket records live checks and plan status. It adds no size, count, or time limit.

The owner does section C and sends the report in step 6.1. You write that report into the plans using the sentences below.

| When | Exact record |
|---|---|
| Plan 0001 status, always | `- **Status:** Complete, except phase 4 (keep-awake), which stays deferred` |
| Plan 0001 phase 3, always | `\| 3. Web \| 5 / 5 \| Complete \|` |
| Plan 0001 phase 4, always | leave `\| 4. Keep awake \| 0 / 2 \| **Deferred** — see the note in phase 4 \|` |
| Plan 0003 status, always | `- **Status:** Complete` |
| Plan 0003 phase 3, owner sure the migration ran before #6 | `\| 3. Admin screen — release 1 ships \| 5 / 5 \| Done \|` |
| Plan 0003 phase 3, owner not sure, or migration applied on the report date | `\| 3. Admin screen — release 1 ships \| 4 / 5 \| Done — 3.5 action remains open; migration was not proven before #6 \|` |
| Plan 0003 phase 6, always | `\| 6. Docs and release 2 \| 2 / 3 \| Done — 6.3 action superseded by 3.5; Verify done \|` |
| README 0001 and 0003, always | the status cell `Complete` |

Live sentences the owner's report must already have confirmed, from the shipped screens:

| Moment | Sentence |
|---|---|
| Empty catalogue, before any rollout product | `No produce yet` |
| Pending account, Sell | `We are checking your account` |
| Pending account, basket with an item | `We are checking your account` and `You can place this order once it is approved. Your basket is saved on this phone.` |
| Approved account, basket with an item | button `Place order · pay on pickup` |
| Pending farm | `We are checking your farm` |
| Signed-in non-admin opening `/admin` | `This page does not exist` |

## 5. Setup — before any change

1. Read: `docs/plans/0001-deployment.md`, `docs/plans/0003-admin-approval-queue.md`, `docs/plans/README.md`, `docs/reference/deployments.md`, `scripts/check-plan-status.mjs`, `CLAUDE.md`.
2. Use a scratch folder outside the repository for temporary files: the one your tool gives you; if it gives none, `/tmp/going-dark` on macOS and Linux, `%TEMP%\going-dark` on Windows.
3. Local processes you may run: none. Do not start Docker, the API, the web app, a browser, or `db:migrate`. Do not call the live site. `npm test` already runs backend tests one file at a time (`fileParallelism: false` in `backend/vitest.config.ts`). Stop everything you start before you report. Never start anything else.
4. Baseline. Before changing anything, run:
   `npm run typecheck`
   `npm run lint`
   `npm test`
   `npm run docs:check`
   All must pass. If any fails before you changed anything, STOP and report it.

## 6. PR 1 — Record that the live site and the approval queue are finished

### Step 6.1 — Require the owner's report

**Action:** Read section C. If you do not have a written report from the owner containing every field below, STOP and ask them to do section C and reply with the report. Do not edit a file yet.

The report fields:

- `date`, as `YYYY-MM-DD`
- `pwaUrl`
- `apiUrl`
- `healthStatus`, the HTTP status, and `healthDatabase`, the `data.database` value
- `corsOrigins`, the exact value saved on Render
- `viteApiBaseUrl`, `absent` or `removed`
- `migration`, one of `before-6`, `applied-on-date`, `already-applied-not-sure`
- `migrationAppliedOn`, a date when `migration` is `applied-on-date`, otherwise empty
- `pendingBeforeTest`, a number
- `gapApprovedInAdmin`, a number, `none`, or `column-default`
- `sessionSurvivedReload`, `yes` or `no`
- `newAccountInQueue`, `yes` or `no`
- `pre6MeApproved`, `yes` or `no`
- `orderBlockedCopySeen`, `yes` or `no`
- `orderPlacedAfterApproval`, `yes` or `no`
- `farmReviewTitle`, the title they saw
- `androidInstallLabel`, the menu words they saw
- `catalogueBeforeProduct`, `empty` or `already-listed`

**Check:** Every field is present. `apiUrl` is `https://ani-api-njg8.onrender.com`. `healthStatus` is `200`. `healthDatabase` is `up`. `viteApiBaseUrl` is `absent` or `removed`. `sessionSurvivedReload`, `newAccountInQueue`, `pre6MeApproved`, `orderBlockedCopySeen`, and `orderPlacedAfterApproval` are `yes`. `farmReviewTitle` is `We are checking your farm`. `androidInstallLabel` is one or more words. `corsOrigins` equals `pwaUrl` and has no trailing slash. If any of these differ, STOP and ask. Do not open the pull request.

### Step 6.2 — Update plan 0001

**Action:** In `docs/plans/0001-deployment.md`:

1. Replace the status line `In progress` with `Complete, except phase 4 (keep-awake), which stays deferred`.
2. Replace the phase 3 row `3 / 5` / `In progress` with `5 / 5` / `Complete`.
3. Leave the phase 4 row as it is, including `**Deferred**`.
4. Change the step 3.4 Action and Verify checkboxes from `- [ ]` to `- [x]`. Find them by `Deploy. Note the production URL` and `The deployed site loads`.
5. Change the step 3.5 Action and Verify checkboxes from `- [ ]` to `- [x]`. Find them by `register an account, reload the page` and `After reload you are still signed in`.
6. Change these acceptance checkboxes from `- [ ]` to `- [x]`: `/api/v1/health` reports, `The Vercel site loads`, `Register, reload, still signed in`, `A farm can register and shows as under review`, `Chrome on Android offers "Add to Home Screen"`.
7. Leave `Keep-awake deliberately left off, and the reason understood` as `- [ ]`.
8. After the step 3.4 Verify paragraph, add:

```
*Done <date>:* Production URL `<pwaUrl>`. `CORS_ORIGINS` on Render is that URL, with no trailing slash. `VITE_API_BASE_URL` is unset on Vercel. The catalogue request returned 200 from that host.
```

9. After the step 3.5 Verify paragraph, add:

```
*Done <date>:* Register and reload stayed signed in. After the account was approved, a farm was registered and Sell showed "We are checking your farm".
```

10. Under the Android acceptance item, add:

```
*Done <date>:* Chrome on Android offered "<androidInstallLabel>".
```

Replace `<date>`, `<pwaUrl>`, and `<androidInstallLabel>` with the report values. If `pwaUrl` is not `https://ani-staging-blrn.vercel.app`, also replace that URL in this file's Live URLs table.

**Check:** `git grep -n "Keep-awake deliberately left off" docs/plans/0001-deployment.md` prints a line that begins `- [ ]`. `git grep -n "except phase 4" docs/plans/0001-deployment.md` prints the new status line. `git grep -n "5 / 5" docs/plans/0001-deployment.md` prints the phase 3 row.

### Step 6.3 — Update plan 0003

**Action:** In `docs/plans/0003-admin-approval-queue.md`:

1. Replace the status line `In progress` with `Complete`.
2. Replace the phase 6 row with:

```
| 6. Docs and release 2 | 2 / 3 | Done — 6.3 action superseded by 3.5; Verify done |
```

3. Leave step 6.3's Action as `- [ ]`. Find it by `Open the pull request.`
4. Change step 6.3's Verify from `- [ ]` to `- [x]`. Find it by `a new sign-up cannot place an order`.
5. After that Verify paragraph, add:

```
*Live check, <date>:* With produce in the basket, the new account saw "We are checking your account" and no "Place order · pay on pickup" button. After approval in `/admin`, that button was there and the order was placed. Sell then showed "We are checking your farm". No second pull request was opened.
```

6. Change `Every account that existed before release 1 is` from `- [ ]` to `- [x]`.

Then follow the one branch that matches `migration`.

**Branch `before-6`:**

- Replace the phase 3 row with `| 3. Admin screen — release 1 ships | 5 / 5 | Done |`.
- Change step 3.5's Action and Verify from `- [ ]` to `- [x]`. Find the Action by the line `- [ ] **Action.**` under `### Step 3.5 — Ship release 1`. Find the Verify by `the admin signs in and opens`.
- Change `The migration was applied to Supabase **before** the merge` from `- [ ]` to `- [x]`.
- If `gapApprovedInAdmin` is `none`, change `Accounts that signed up between the migration and the merge` from `- [ ]` to `- [x]` and add `*Live check, <date>:* None.`
- If `gapApprovedInAdmin` is a number greater than 0, tick that same box and add `*Live check, <date>:* Approved in /admin: <count>.`
- If `gapApprovedInAdmin` is `column-default`, STOP and ask. That value does not belong on this branch.
- After the step 3.5 Verify paragraph, add: `*Live check, <date>:* Migration `0003_approval_review` was already applied before #6 merged. The admin opened `/admin` and the rollout-check account was in New accounts. An account created before #6 showed `approval.status` `approved` on `GET /api/v1/me`.`

**Branch `applied-on-date` or `already-applied-not-sure`:**

- Replace the phase 3 row with `| 3. Admin screen — release 1 ships | 4 / 5 | Done — 3.5 action remains open; migration was not proven before #6 |`.
- Leave step 3.5's Action as `- [ ]`.
- Change step 3.5's Verify from `- [ ]` to `- [x]`.
- Leave both remaining acceptance boxes unticked: `The migration was applied to Supabase **before** the merge` and `Accounts that signed up between the migration and the merge`.
- After the step 3.5 Verify paragraph, add one of these.

For `applied-on-date`:

```
*Live check, <date>:* The admin opened `/admin` and the rollout-check account was in New accounts. An account created before #6 showed `approval.status` `approved` on `GET /api/v1/me`. Migration `0003_approval_review` was applied on <migrationAppliedOn>, after #6 had merged. Existing accounts were approved by the column default, not in `/admin`. The Action stays open because it requires the migration before the merge.
```

For `already-applied-not-sure`:

```
*Live check, <date>:* The admin opened `/admin` and the rollout-check account was in New accounts. An account created before #6 showed `approval.status` `approved` on `GET /api/v1/me`. Migration `0003_approval_review` was already applied. It could not be shown to have run before #6 merged: `drizzle.__drizzle_migrations.created_at` stores the file timestamp `1790627162302`, not the time it was applied. The Action stays open.
```

**Check:** `git grep -n "^\- \*\*Status:\*\*" docs/plans/0003-admin-approval-queue.md` prints `Complete`. `git grep -n "Open the pull request" docs/plans/0003-admin-approval-queue.md` prints a line that begins `- [ ]`. On `before-6`, `git grep -n "before the merge" docs/plans/0003-admin-approval-queue.md` prints a line that begins `- [x]`. On the other branches, that line begins `- [ ]`.

### Step 6.4 — Update the plan index

**Action:** In `docs/plans/README.md`, change the status cell of the `0001` row and the `0003` row from `In progress` to `Complete`. Leave every other row as it is.

**Check:** `git grep -n "0001-deployment.md" docs/plans/README.md` and `git grep -n "0003-admin-approval-queue.md" docs/plans/README.md` each print a line ending in `Complete`. `git grep -n "In progress" docs/plans/README.md` still prints the `0002` and `0004` rows.

### Step 6.5 — Update the deployment reference when the PWA URL changed

**Action:** If `pwaUrl` is `https://ani-staging-blrn.vercel.app`, leave `docs/reference/deployments.md` unchanged. If it is a different `https://` URL with no path and no trailing slash, replace `https://ani-staging-blrn.vercel.app` with `pwaUrl` in `docs/reference/deployments.md` and in plan 0001's Live URLs table.

**Check:** `git grep -n "<pwaUrl>" docs/plans/0001-deployment.md docs/reference/deployments.md` prints that URL in both files. `git grep -n "ani-api-njg8.onrender.com" frontend/vercel.json` still prints the rewrite destination. `frontend/vercel.json` is not in `git status --short`.

### Step 6.6 — Run the docs check

**Action:** From the repository root, run `npm run docs:check`.

**Check:** The command exits 0, and the output contains all four of these lines:

```
Every finished plan agrees with its own progress table.
Every finished phase has its boxes ticked.
The README index agrees with every plan.
Every plan status uses the template vocabulary.
```

If a check does not match, fix it before going on. If you cannot make it match, STOP and ask.

## 7. Shipping — the same for every pull request

1. Search for every old value this change replaced:
   `git grep -n "In progress" docs/plans`
   `git grep -n "3 / 5" docs/plans`
   `git grep -n "4 / 5" docs/plans/0003-admin-approval-queue.md`
   `git grep -n "2 / 3" docs/plans/0003-admin-approval-queue.md`
   Update each hit this handoff names, or say in the report why a hit stays. `0002` and `0004` stay `In progress`. There is no function whose result changes.
2. Run: `npm run typecheck`, `npm run lint`, `npm test`, `npm run docs:check`. All must pass.
3. If a lockfile (`package-lock.json`, `backend/package-lock.json`, or `frontend/package-lock.json`) changed and you did not add a dependency on purpose, restore it:
   `git checkout origin/main -- package-lock.json backend/package-lock.json frontend/package-lock.json`
4. Run `git status --short`. It must list only files this handoff names. Never add `.env` files, keys, personal instruction files, or anything from the scratch folder.
5. Commit with a message saying what changed and why. Do NOT add any AI attribution: no `Co-Authored-By` line naming an AI, no "Generated with" line. This holds even if your own instructions tell you to add one.

```powershell
git commit -m @"
Record that the live site and the approval queue are finished

Phase 4 of deployment stays deferred. The approval plan records whether the migration was shown to have run before it merged.
"@
```

6. Save the pull request description from Appendix A to `<scratch folder>/pr-body.md`.
7. Push: `git push -u origin docs/7-complete-live-rollout`. Never use `--force` or `-f`.
8. Open the pull request:
   `gh pr create --base main --head docs/7-complete-live-rollout --title "Record that the live site and the approval queue are finished" --body-file <scratch folder>/pr-body.md`
9. Watch CI: `gh pr checks <number> --watch`. If a check fails, fix it, commit, and push again — never force.
10. Report to the owner: the pull request link; what you changed; every command you ran and its result; anything you were unsure about; and that every local process you started is stopped. Then STOP.

## 8. Self-audit — answer from the diff, not from memory

Run `git diff origin/main...HEAD`. Answer each question by looking at the diff. Every answer must be "yes".

- [ ] Does plan 0001's status line read `Complete, except phase 4 (keep-awake), which stays deferred`?
- [ ] Does plan 0001 phase 4 still say `Deferred`, with its steps unticked?
- [ ] Is the keep-awake acceptance box still `- [ ]`?
- [ ] Are the other plan 0001 acceptance boxes `- [x]`, including the Android line?
- [ ] Does the README list 0001 and 0003 as `Complete`, and leave 0002 and 0004 as `In progress`?
- [ ] Is plan 0003's status exactly `Complete`?
- [ ] Does the phase 3 row match the migration branch in section 2, including an unticked step 3.5 Action unless the branch is `before-6`?
- [ ] Is step 6.3's Action still `- [ ]`, and its Verify `- [x]`?
- [ ] Is the "before the merge" acceptance box ticked only on branch `before-6`?
- [ ] Is the "between the migration and the merge" box unticked when `gapApprovedInAdmin` is `column-default`?
- [ ] Do the dated notes use the report date, and contain no username, password, phone number, address, or database URL?
- [ ] Does the diff leave `frontend/vercel.json` unchanged?
- [ ] Does the diff change only files this handoff names?
- [ ] Is there no secret, key, password or personal data in the diff?
- [ ] Is there no AI attribution in any commit message?

## 9. When to stop and ask

STOP, do nothing else, and ask the owner when:

- the code differs from section 3;
- a check fails and one attempt to fix it did not work;
- a step needs a decision that is not in section 2;
- you would need to change a file this handoff does not name;
- anything would send email or messages, publish, delete data, or write to a hosted service. Only staging is ever allowed, and only when a step says so;
- you need a secret. Never print, copy or commit a secret's value — ask the owner to set it;
- a command asks for a password, a login or a confirmation;
- the report is missing, or any check in step 6.1 is not the required value;
- `apiUrl` is not `https://ani-api-njg8.onrender.com`.

Section C writes to Supabase, Render, and the live site. That is the owner's work. You do not run it.

## 10. Appendices

### A. Pull request description for PR 1

```
## Summary
- Record that the Vercel site and the approval queue passed their live checks.
- Plan 0001 stays deferred at phase 4, keep-awake, so its status line says so. The index says Complete.
- Plan 0003 records whether migration 0003_approval_review was shown to have run before #6.

## Test plan
- [ ] `npm run docs:check` passes
- [ ] `docs/plans/README.md` lists 0001 and 0003 as Complete
- [ ] Plan 0001 phase 4 is still Deferred and its boxes are still open
- [ ] The keep-awake acceptance box in plan 0001 is still open
- [ ] CI on this pull request is green
```

### B. Exact file contents

None. Steps 6.2 to 6.5 edit the existing files. Do not replace a whole file.

### C. The owner's own steps (not for the builder)

Do these in order. Send the builder the report from step 6.1 when they are done. Do not send a password, a phone number, an address, a username, or the database URL.

The site is https://ani-staging-blrn.vercel.app. The API is https://ani-api-njg8.onrender.com. The database is Supabase project `ani-staging`, Singapore. #6 merged as commit `0da686a99379e2f24a99132c7646cc145624e2c8`.

1. **Health.** Open https://ani-api-njg8.onrender.com/api/v1/health. A cold start can take about a minute. Retry once. Record `healthStatus` and `healthDatabase`. Continue when the status is 200 and `data.database` is `up`.

2. **Migration.** Supabase dashboard → project `ani-staging` → SQL Editor. Run:

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'users'
  and column_name = 'approval_status';
```

One row means the migration has been applied. Zero rows means it has not. Do not use `drizzle.__drizzle_migrations.created_at` to decide whether it ran before #6. That column stores `1790627162302`, the file timestamp.

If the column is missing, apply the migration from the repository root in PowerShell. Use the session pooler URI from Supabase → project `ani-staging` → Connect → Session pooler. The host contains `pooler.supabase.com` and the port is `5432`. Do not write the URI into `backend/.env`, the report, or a commit. Clear it when the command finishes. If the output shows the password, do not copy that output anywhere.

```powershell
$env:DATABASE_URL = "<the session pooler URI>"
npm --prefix backend run db:migrate
Remove-Item Env:DATABASE_URL
```

This adds `approval_status` with a temporary default of `approved`, so every user who exists at that moment becomes approved. It then changes the default to `pending`. Run the column query again. It must return one row. Set `migration` to `applied-on-date` and `migrationAppliedOn` to today.

If the column was already there and you are sure you applied this migration before merging #6, set `migration` to `before-6`. If the column was already there and you are not sure, set `migration` to `already-applied-not-sure`.

3. **Count people already waiting.** In the same SQL Editor:

```sql
select count(*) from users where approval_status = 'pending';
```

Record that number as `pendingBeforeTest`. Do not copy names.

4. **Production admin.** In the SQL Editor:

```sql
select username, is_admin, approval_status
from users
where is_admin = true;
```

If a row is `is_admin` true and `approval_status` `approved`, sign in as that account later. If your own account exists, is approved, and is not admin, run this with your username:

```sql
update users set is_admin = true where username = '<your username>';
```

If you have no account, register one at https://ani-staging-blrn.vercel.app/register after the migration is applied. Then run both assignments, because `/admin` refuses "You cannot review your own account.":

```sql
update users
set is_admin = true, approval_status = 'approved'
where username = '<the username you just registered>';
```

Use the same update of `approval_status` when the admin row exists but is not `approved`.

5. **CORS.** Render dashboard → the service whose public URL is https://ani-api-njg8.onrender.com (plan 0001 named it `ani-api`) → Environment. Set `CORS_ORIGINS` to `https://ani-staging-blrn.vercel.app` with no trailing slash and no path. Save, and wait until the service says Live. Record that value as `corsOrigins`. If the browser's address bar shows a different production origin, use that exact origin instead, with no trailing slash, and record it as `pwaUrl`.

6. **Vercel variable.** Vercel dashboard → the project that serves the PWA URL → Settings → Environment Variables. `VITE_API_BASE_URL` must be absent. If it is set, delete it and redeploy. Record `absent` or `removed`.

7. **Catalogue, before adding anything.** Open `pwaUrl`. In the browser's network panel, `/api/v1/products` returns 200 and its host is the Vercel host. The console shows no errors. If the page says `No produce yet`, set `catalogueBeforeProduct` to `empty`. If products are already listed, set it to `already-listed`.

8. **A product on a farm you control.** The order check needs one item in the basket. If a product is already listed on a farm you control, use that. If the only products belong to someone else, do not order them. If the catalogue is empty, do this:

- Sign in as the approved admin.
- Open Sell. If it says `We are checking your account`, the account is not approved. Use the SQL in step 4. Do not approve your own account in `/admin`.
- If it offers `Register my farm`, open it, fill the form, and press `Send for review`.
- Open `/admin`. Under New farms, press `Approve`, then `Approve` in the dialog. A farm whose owner is still pending cannot be approved.
- On `pwaUrl`, signed in as that farm's owner, open the browser console and run:

```javascript
await fetch('/api/v1/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Rollout check',
    category: 'vegetables',
    pricePesos: 1,
    stockAmount: 1,
    unit: 'piece',
  }),
}).then(async (response) => ({ status: response.status, body: await response.json() }))
```

Continue when `status` is 201 and `body.data.name` is `Rollout check`. A 403 that says `Register your farm before listing produce.` means the farm is missing. A 403 that says `Your farm is still awaiting approval.` means the farm is still pending. A 403 that says `We are still checking your account. You can do this once it is approved.` means the account is not approved.

9. **Rollout-check buyer.** Use a private window. Open `pwaUrl/register`. Create an account with a username that starts with `rollout`, a password of at least 8 characters, and a phone number you control. You land on Browse. Reload the page. Open the account icon, accessible name `Your account`. You are still signed in. Set `sessionSurvivedReload` to `yes`. Sign out of this window only after step 12.

10. **Queue.** In the admin window, open `/admin`. The rollout-check account is under New accounts. Set `newAccountInQueue` to `yes`. If `pendingBeforeTest` was greater than 0 and `migration` is `before-6`, approve those earlier accounts in `/admin` and set `gapApprovedInAdmin` to that count. Leave the rollout-check account pending. If `pendingBeforeTest` was 0, set `gapApprovedInAdmin` to `none`. If `migration` is `applied-on-date`, set `gapApprovedInAdmin` to `column-default`.

11. **An account from before #6.** Sign in as an account that existed before #6. In the network panel, `GET /api/v1/me` has `data.approval.status` equal to `approved`. Set `pre6MeApproved` to `yes`.

12. **Order block, then approval.** In the buyer window, open the rollout product and press `Add to basket`. Open Basket. The page shows `We are checking your account` and `You can place this order once it is approved. Your basket is saved on this phone.` The button `Place order · pay on pickup` is absent. Set `orderBlockedCopySeen` to `yes`. In the admin window, approve that account. Reload Basket. The button `Place order · pay on pickup` is present. Press it. You land on Orders. Set `orderPlacedAfterApproval` to `yes`.

13. **Farm.** In the buyer window, open Sell. It offers `Register my farm`. Register a farm and press `Send for review`. Sell shows `We are checking your farm`. Set `farmReviewTitle` to that title.

14. **Android.** On a phone, open the PWA URL in Chrome. Use the browser menu and record the words of the item that adds or installs the site, as `androidInstallLabel`.

15. Reply to the builder with the fields in step 6.1. Keep the password, phone number, address, username, and database URL out of that reply.
