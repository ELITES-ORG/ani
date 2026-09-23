# 0013. Bottom navigation on phones

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani is used on a phone, one-handed, frequently outdoors and often while
carrying something. The four destinations that matter are Browse, Cart,
Orders, and Sell.

## Decision

A fixed bottom bar with those four destinations, always visible, respecting
`env(safe-area-inset-bottom)` so it clears the home indicator. Targets are at
least 44px tall. The cart carries a count badge.

## Alternatives considered

**A hamburger menu.** Hides every destination behind a tap and a mental model.
For four items on a phone it is strictly worse.

**A top tab bar.** The top of a modern phone screen is the hardest place for a
thumb to reach one-handed, and it competes with the browser's own chrome in an
installed PWA.

## Consequences

Every primary destination is one thumb-reach away, and the cart count is
permanently visible — which matters for a marketplace where an abandoned cart
is a lost order.

The bar costs vertical space on short screens, so page content carries bottom
padding to clear it. A fifth destination would not fit; if one is ever needed
it belongs inside Sell or Orders rather than in the bar.
