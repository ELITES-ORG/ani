# 0005. Finish sign-up and sign-in

- **Status:** Ready
- **Owner:** unassigned
- **Related:** [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md),
  [ADR 0007](../decisions/0007-one-account-selling-is-a-role.md),
  [ADR 0013](../decisions/0013-bottom-navigation-on-phones.md),
  [ADR 0016](../decisions/0016-the-interface-assumes-no-app-literacy.md)

## Read this first

**Authentication already works.** Do not rebuild it.

Registering, signing in, signing out and session persistence are implemented
and verified against the deployed stack — an account created through the live
site issues a cookie that survives a separate request. The backend module,
the session store, the API client and both forms exist and are styled.

What is missing is everything around it. This plan closes three gaps that
make the existing auth unusable in practice:

1. **There is no way to sign out.** `useLogout` in
   `frontend/src/features/auth/api.ts` is fully written and called from
   nowhere. No screen offers it.
2. **Signing in loses your place.** Tapping "Sign in to order" in the basket
   sends you to Browse afterwards. Someone who was mid-purchase has to find
   their way back on their own, which most will not.
3. **An expired session surfaces as an error.** Nothing handles a 401 from a
   normal request, so a dead cookie makes Orders and Sell show a failure
   instead of their signed-out state.

## Goal

Someone can create an account, sign in, be returned to whatever they were
doing, see who they are signed in as, and sign out — on a phone, without
help.

## Scope

**In scope**

- A return path through sign-in and registration
- An account screen: who you are, and the way out
- Signing out, with confirmation
- Handling a session that ends on its own
- Field-level errors on the two forms

**Out of scope**

- **Password reset.** It needs a delivery channel, and SMS costs money per
  message with no usable free tier — deferred in
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md).
  A user who forgets their password currently cannot recover it. That is a
  known hole, not an oversight, and it is the first follow-up.
- Changing a password, editing a profile, deleting an account
- Social or phone-code sign-in
- Any new API endpoint. **This plan is frontend-only** — every endpoint it
  needs already exists and is documented in
  [reference/api.md](../reference/api.md)

## Prerequisites

Everything runs locally:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:api     # :4000
npm run dev:web     # :5173
```

Use the Vite server on 5173, never the API port directly — it proxies `/api`
so the browser stays on one origin, which is what makes the session cookie
behave as it will in production.

## Blockers

None.

## Progress

| Phase | Steps | Status |
|---|---|---|
| 1. Return where you were | 0 / 3 | Not started |
| 2. Signing out | 0 / 3 | Not started |
| 3. When the session ends | 0 / 1 | Not started |
| 4. Form errors | 0 / 2 | Not started |

---

## Phase 1 — Sign-in returns you where you were

### Step 1.1 — A safe return path

- [ ] **Action.** Add `frontend/src/lib/return-path.ts` exporting
      `readReturnPath(search: string): string`. It reads the `next` query
      parameter and returns it **only** if it is an in-app path: begins with
      a single `/`, and does not begin with `//` or contain `:`. Anything
      else returns `/`.
- [ ] **Verify.** Add `return-path.test.ts` next to it and run
      `npm --prefix frontend test`. It must cover `/cart` → `/cart`,
      missing → `/`, `//evil.com` → `/`, `https://evil.com` → `/`,
      `javascript:alert(1)` → `/`.

An unvalidated `next` is an open redirect: a link to
`…/login?next=https://evil.example` would bounce someone to an attacker's
page immediately after they type their password. Validate it, do not trust
it.

### Step 1.2 — Send the intent with the link

- [ ] **Action.** Every "sign in" entry point passes where it came from:
      - `pages/CartPage.tsx` — `/login?next=/cart`
      - `pages/OrdersPage.tsx` — `/login?next=/orders`
      - `pages/SellPage.tsx` — `/login?next=/sell`

      Keep the existing copy. Only the `to` changes.
- [ ] **Verify.** With an empty session, each screen's sign-in link lands on
      `/login?next=…`.

### Step 1.3 — Honour it on both forms

- [ ] **Action.** In `pages/LoginPage.tsx` and `pages/RegisterPage.tsx`,
      replace `navigate('/')` with the resolved return path, and pass
      `{ replace: true }`.

      Carry `next` between the two: the "Create one" and "Sign in" links at
      the bottom of each form must preserve it, or someone who switches form
      loses their place anyway.
- [ ] **Verify.** Put something in the basket signed out, tap **Sign in to
      order**, sign in. You land back on the basket **with the items still
      there**. Pressing Back does not return you to the sign-in form.

`replace: true` matters: without it, Back lands on a sign-in page for a
session that already exists, which looks broken.

---

## Phase 2 — Signing out

There is no room for a fifth tab
([ADR 0013](../decisions/0013-bottom-navigation-on-phones.md)), so the
account lives behind a header control, not in the bottom bar.

**If you choose a different home for it, record an ADR** — where identity
lives is a decision with consequences, not an implementation detail.

### Step 2.1 — The account screen

- [ ] **Action.** Add `pages/AccountPage.tsx` at `/account`. It shows, for a
      signed-in user: their name, username, mobile number, and whether they
      have a farm (and its status). Signed out, it shows an `EmptyState`
      offering sign-in — the same shape Orders already uses.

      Add `'/account': 'Your account'` to `TITLES` in
      `components/AppHeader.tsx`. It is **not** a tab, so it gets a back
      arrow automatically.
- [ ] **Verify.** `/account` signed in shows your details; signed out it
      offers sign-in. `npm --prefix frontend run typecheck` passes.

### Step 2.2 — A way to reach it

- [ ] **Action.** Add a right-aligned account button to `AppHeader`, visible
      on tab routes only, linking to `/account`. Minimum 44px, with an
      `aria-label`. Use `CircleUser` from `lucide-react`.
- [ ] **Verify.** The button appears on all four tabs and not on sub-pages,
      where the back arrow occupies that role. Check the home header still
      fits at 360px without the wordmark wrapping.

### Step 2.3 — Sign out

- [ ] **Action.** On the account screen, a `danger` Button that opens
      `ConfirmDialog` before calling the existing `useLogout`. On success,
      navigate to `/` with `{ replace: true }`.

      Title: "Sign out?" Description: say that the basket stays on this
      phone. Confirm: "Sign out". Cancel is the default and the wider
      target.
- [ ] **Verify.** Sign out, then `curl` `/api/v1/me` with the old cookie →
      `401`. Orders shows its signed-out state. **The basket still has its
      items** — it is `localStorage`, per-device, and holds nothing personal.

Do not clear the basket on sign out. Someone signing out on a shared phone
loses nothing private, and someone who signs out by accident loses their
shopping.

---

## Phase 3 — When the session ends on its own

### Step 3.1 — A 401 means signed out, not broken

- [ ] **Action.** In `frontend/src/lib/api-client.ts`, add an axios response
      interceptor: on a `401`, set the cached current user to `null` via the
      query client, then re-throw so the calling hook still sees the error.

      Import the client lazily or restructure to avoid a circular import
      between `api-client.ts` and `lib/query-client.ts` — check with
      `npm --prefix frontend run build`, not just typecheck.

      **Do not redirect.** Being thrown to a sign-in page mid-task is more
      alarming than the screen simply saying you are signed out.
- [ ] **Verify.** Sign in, delete the `ani.sid` cookie in devtools, open
      Orders. You get the "Sign in to see your orders" empty state, not
      `ErrorNotice`.

---

## Phase 4 — Form errors land on the field

### Step 4.1 — Duplicate username

- [ ] **Action.** The API answers a taken username with `409` and
      `"That username is already taken."` Show it as the `error` prop on the
      username `TextField`, not only as the `ErrorNotice` at the bottom of
      the form. Keep the notice for everything else.
- [ ] **Verify.** Register `zz_web_check` (it exists in staging) or any
      local duplicate. The message appears under the username field and the
      field is outlined in `danger`.

### Step 4.2 — Username rules, client-side

- [ ] **Action.** The server accepts `^[a-zA-Z0-9_.]+$`, 3–30 characters,
      and lowercases it. Mirror that in `RegisterPage` as a field error, and
      say in the hint that it will be saved in lowercase.
- [ ] **Verify.** Typing `Juan Cruz` shows a field error naming what is
      allowed, before submitting.

---

## Acceptance

- [ ] Sign in from the basket returns to the basket, items intact
- [ ] Back after signing in does not show the sign-in form
- [ ] `/account` shows name, username, phone, and farm status
- [ ] Sign out confirms first, and afterwards `/me` returns 401
- [ ] The basket survives signing out
- [ ] A deleted cookie produces a signed-out screen, not an error
- [ ] A duplicate username is reported on the field
- [ ] `npm run typecheck && npm run lint && npm test && npm run docs:check`
- [ ] Every new screen checked at **360px**, all four data states handled
- [ ] `docs/reference/api.md` unchanged — this plan adds no endpoints

## Follow-ups

- **Password reset.** The largest hole. Needs the SMS channel deferred in
  [ADR 0006](../decisions/0006-username-password-auth-with-server-sessions.md)
- Change password from the account screen, once reset exists
- Rate-limit feedback: `authLimiter` allows 20 attempts per 15 minutes and
  answers `429`. `toApiError` currently renders that as a plain message with
  no indication of when to try again
- Editing a profile
