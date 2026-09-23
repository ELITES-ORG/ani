# 0007. One account; selling is a role you add

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani has two MVPs: customers order produce, and customers register as vendors.
The second sentence already contains the answer — a vendor is a customer who
also sells.

In a farming province this is the normal case, not an edge case. A household
that sells kamote also buys fish. Forcing a choice at registration would make
people maintain two accounts to do both.

## Decision

One `users` row per person. A `vendors` row is attached to a user account when
they register a farm, unique per user.

Registration asks nothing about intent. The Sell tab is visible to everyone;
what it shows depends on whether the account has a farm, and what its status
is.

`GET /api/v1/me` returns `vendor: null` or a summary, and the UI branches on
that single field.

## Alternatives considered

**Separate buyer and seller accounts.** Clean separation, and it means a farmer
signs in as one person to sell and another to buy. Rejected on the lived
reality of the users.

**A `role` column on the user.** Works until someone is both, which is the
common case. A nullable relation says "may also sell" more honestly than an
enum that has to grow a `both` value.

## Consequences

**Easier.** Becoming a vendor is one form, with no new credentials and no
second sign-in. Orders reference `users.id` for the buyer and `vendors.id` for
the seller, so the same person appears on both sides of the marketplace
without any special handling.

**Harder.** Every vendor-only endpoint must resolve the user's farm and check
its status, rather than trusting a role on the session. That check lives in
the services, and `requireAuth` deliberately does not do it — being signed in
and being an approved farm are different questions.

A farm cannot yet be operated by two people. That is a real limitation for a
family operation, and it is a schema change (a join table) rather than a
rewrite when it matters.
