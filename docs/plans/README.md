# Plans

A plan is the unit of work. It describes how to build one specific thing, in
steps small enough that each has a verification command.

Plans are **finished, not maintained**. A shipped plan is marked Complete and
left as the record of how that feature was built — not updated to match later
changes.

---

## Status

| Status | Means |
|---|---|
| **Draft** | Being written. Not ready to execute |
| **Ready** | Executable now. Prerequisites are met |
| **Blocked** | Cannot start. The blocker is named in the plan |
| **In progress** | Somebody is executing it |
| **Complete** | Shipped. Left as a record |

---

## Writing one

Copy `_template.md`. Number sequentially; never renumber.

Each step gets an **Action** and a **Verify**. If a step cannot be verified by
running something, it is too vague to hand to anyone.

---

## Index

| # | Plan | Status |
|---|---|---|
| [0001](./0001-deployment.md) | Deployment — Supabase, Render, Vercel | In progress |
| [0002](./0002-product-photos.md) | Product photos | Draft |
| [0003](./0003-admin-approval-queue.md) | Admin approval queue | Ready |
| [0004](./0004-offline-catalogue.md) | Offline catalogue | Draft |
