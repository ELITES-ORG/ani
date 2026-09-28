# 0020. Every account is reviewed before it can order

- **Status:** Proposed
- **Date:** 2026-09-29

## Context

[ADR 0011](./0011-vendors-are-reviewed-before-listing.md) put every new farm
through a review before its produce reaches buyers. Buyers were not reviewed:
an account could order the moment it was created.

That leaves the other half of every transaction unchecked. An order here is
not a card payment — the buyer pays the farm on pickup, and the farm harvests,
weighs and sets produce aside on the strength of the order alone. A fake or
prank order costs a farm a harvest it cannot sell to anyone else before it
spoils ([constraints §4](../explanation/constraints.md)). Ani is also meant for
Biliran: an account with an invented name and address is somebody the farm
cannot identify when they arrive to collect. And in a province where
[everyone knows everyone](../explanation/constraints.md), one bad experience
travels further than any number of good ones.

The owner's requirement is that every person on Ani is known to an admin before
they can transact: stopping fake orders, keeping the marketplace to real
residents, and general trust.

## Decision

A new account is created with `approval_status = 'pending'`. An admin moves it
to `approved`, or to `rejected` with a written reason.

While pending or rejected, the account **can** sign in, browse, and fill a
basket. It **cannot** place an order or register a farm; the API refuses with a
403 that says why, and the screens say so before anyone taps.

A rejected account sees the reason, corrects its details, and is sent back to
`pending`. Rejection is not a dead end.

Selling stays a second, separate review. An account must be approved before it
can register a farm, and the farm is then reviewed on its own, as ADR 0011
describes. The farm review gains the same `rejected`-with-a-reason outcome, so
a rejected farm is distinct from a suspended one.

Accounts that already exist are approved by the migration that introduces the
column. Nobody using Ani today is locked out by this change.

Approval is stored as columns on the row it describes — `approval_status`,
`review_note`, `reviewed_at`, `reviewed_by` on `users`; the same review columns
beside the existing `status` on `vendors` — so the check is one column read on
a row every authenticated request already loads.

## Alternatives considered

**Review buyers only at their first order.** Hold the first order until an
admin approves the account, and let later orders through. Less friction at
sign-up, but the farm is then notified of an order that may never be real,
which is exactly the cost this decision exists to prevent.

**Block sign-in until approved.** Simpler to enforce — one check at login. But
a person who has just filled a basket and registered would be thrown out with
nothing to look at, and would assume the app was broken
([ADR 0016](./0016-the-interface-assumes-no-app-literacy.md)). Letting them in
while blocking only the transaction keeps the basket, and the wait, visible.

**A separate `reviews` table.** One row per decision, for people and farms
alike. It records history — rejected, resubmitted, approved — that columns do
not. Rejected for now because it puts a join into the per-request auth check
and a polymorphic reference into the schema for a history nobody has asked
for. It can be added underneath later without changing the API.

**Reject by deleting the account.** Frees the username and needs no new state,
but throws away the reason, which is the only thing that lets someone fix what
was wrong.

## Consequences

**Easier.** Every order comes from a person an admin has seen. A farm can trust
that the name on an order is a real neighbour. Approval is enforced by the API,
not remembered by each screen.

**Harder.** This is friction on the demand side of a marketplace whose binding
constraint is adoption ([constraints §1](../explanation/constraints.md)).
Someone who registers to place an order cannot place it until an admin gets to
them, and until the SMS channel deferred in
[ADR 0006](./0006-username-password-auth-with-server-sessions.md) exists,
nothing tells them when that happens. The queue therefore has to be worked
**daily**; a backlog of more than a day is a lost buyer, not a delay.

**Costs.** An admin reads the personal details of every applicant — name,
phone, home address. That data is collected so a farm can deliver and so a
person can be verified, and the admin queue is the only shape besides
`CurrentUser` that carries it.

If sign-up-to-first-order conversion turns out poor, revisit the first
alternative above before removing review altogether.
