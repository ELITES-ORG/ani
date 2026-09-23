# 0009. An order belongs to one farm

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

A buyer filling a basket does not think in farms — they want kangkong from one
place and bangus from another, and they expect one checkout. The obvious
schema gives an order many line items pointing at products from any vendor.

Then fulfilment happens. One farm has the produce ready and the other has not
started. One cancels. One does pickup, the other delivers. The single order is
now in two states at once, and there is no honest value for its status column.

## Decision

`orders.vendor_id` is `NOT NULL`. An order belongs to exactly one farm.

A basket spanning several farms is split at checkout into one order per farm.
The cart UI shows this before the buyer commits, rather than surfacing it as a
validation error from the API.

## Alternatives considered

**One order, many vendor sub-orders.** The marketplace-at-scale answer:
`orders` as a payment envelope, `sub_orders` as the fulfilment unit. Correct
for Amazon, and for Ani it adds a table and a layer of indirection so that the
buyer sees one number at checkout — while every operation that matters still
happens per farm.

**One order spanning vendors, with per-line status.** The status question just
moves to the line, and "what is the state of this order" stops having an
answer. Cancellation and refunds become per-line too.

## Consequences

**Easier.** Status is a single column with a real meaning and a legal
transition table. A vendor's incoming queue is `where vendor_id = ?`. Cancelling
returns exactly that farm's stock.

**Harder.** A buyer ordering from three farms gets three orders and three
status updates to follow. That is honest — it is three separate trips or three
separate deliveries — but it is more to track than one row would be.

Any future payment integration has to charge per order, or add the envelope
this decision declined to build. That is the point at which to revisit it.
