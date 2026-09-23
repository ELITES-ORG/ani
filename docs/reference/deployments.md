# Deployments

| Service | Host | Free tier reality |
|---|---|---|
| PWA | Vercel | Generous. Not a constraint at this size |
| API | Render | 750 instance-hours a month **per workspace, shared across every free service**; **sleeps after 15 minutes idle**, ~1 minute to wake |
| Database | Supabase | 500MB; **pauses after about a week with no activity**, but keeps the data |

The step-by-step is [plan 0001](../plans/0001-deployment.md). This page is the
reference for what is where and what to watch.

---

## Why this split

Render's own free Postgres **expires 30 days after creation** and is deleted
after a 14-day grace period. That is not a database, it is a countdown, which
is why the data lives on Supabase and only the process runs on Render.

Fly.io was considered and is out: its free allowances were discontinued, and
new accounts get a trial measured in VM-hours.

## Request path in production

```
browser → Vercel (static + rewrite) → Render (Express) → Supabase (Postgres)
```

The Vercel rewrite in `frontend/vercel.json` maps `/api/:path*` to the Render
service. That is what keeps the browser on a single origin, which is what
makes the `sameSite=lax` session cookie work. Pointing the frontend directly
at the Render hostname will break sign-in.

## The hours budget is shared

The 750 free instance hours belong to the Render **workspace**, not to a
service, and running out **suspends every free service in the workspace**
until the month rolls over.

This workspace also hosts Bilikha. Two services each kept awake through the
waking hours come to roughly 1,020 hours against a budget of 750, so both
would be suspended before the month ended. Ani's keep-awake is therefore off
until it has traffic worth protecting.

## Cold starts

A visitor arriving from a Facebook link after a quiet period waits about a
minute for the API to wake. For a first impression that is most of the way to
a bounce.

`.github/workflows/keep-awake.yml` pings `/api/v1/health` on a schedule during
waking hours in PHT. It does not eliminate the problem — it moves it to the
hours nobody is looking.

The real fix is a paid instance. Budget for it before any real push for
adoption.

## Supabase pausing

A free project pauses after roughly a week of inactivity and needs a manual
resume from the dashboard. Data survives. The keep-awake ping touches the
database through the health check, which also keeps the project active.

## Environment

See [environment.md](./environment.md). In short: everything lives on Render;
Vercel needs nothing; `CORS_ORIGINS` must name the Vercel URL, and
`VITE_API_BASE_URL` must stay unset.

## Rolling back

**Vercel** — promote a previous deployment from the dashboard. Instant.

**Render** — redeploy a previous commit. Slower, because the free instance
rebuilds.

**Database** — no automatic rollback. A migration that needs undoing needs a
new migration. Check the generated SQL before it is merged, especially for a
rename Drizzle may have inferred as a drop and an add.
