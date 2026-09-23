# 0011. Vendors are reviewed before their produce is listed

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Anyone with an account can register a farm. Whatever they then list appears in
a catalogue that carries Ani's name, is sold to neighbours, and in some cases
is eaten.

There is no partner institution here and no official mandate. If a listing
misrepresents what it is, the reputational cost lands entirely on this
product, in a province where word travels fast and there is no second chance
at a first impression.

## Decision

A new vendor is created with `status = 'pending'`. A pending farm does not
appear in the catalogue, and its owner cannot list produce — the API refuses
with a 403 that says so.

An admin moves the farm to `approved`. The catalogue query joins vendors and
filters on `status = 'approved'`, so approval is enforced in one place rather
than remembered at each call site.

## Alternatives considered

**Publish immediately, moderate afterwards.** Far better for a cold start —
the thing a two-sided marketplace is most short of is supply, and a review
queue is friction exactly where it hurts. Rejected because the first bad
listing is disproportionately expensive at this size, and because the
moderation risk is entirely ours.

**Verification tiers — publish immediately, badge the verified.** A reasonable
middle, worth revisiting once there is enough supply that the queue is the
bottleneck. It needs a badge design and a verification process that do not
exist yet.

## Consequences

**Easier.** Nothing reaches buyers unseen, and one query filter enforces it.

**Harder.** Somebody has to work the queue, and until they do, a farm that
registered is stuck — the worst possible experience for the supply we are
trying hard to attract. That makes the admin queue urgent rather than
optional; it is tracked in
[plans/0003](../plans/0003-admin-approval-queue.md).

There is no approval endpoint yet. Until there is, approval is a SQL update,
which is acceptable for a handful of farms and not beyond that.
