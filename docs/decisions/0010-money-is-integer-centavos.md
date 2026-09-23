# 0010. Money is integer centavos

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Prices, line totals, and order totals move between Postgres, the API, and the
browser. The default for a price in each of those is a floating point number,
and floating point cannot represent most decimal fractions exactly: `0.1 + 0.2`
is `0.30000000000000004`.

For a marketplace that means an order total that disagrees by a centavo with
the sum a buyer added up, and no way to reconcile it.

## Decision

Money is a whole number of centavos everywhere — `integer` columns, integers
over the API, integers in the client — and is converted to pesos only at the
moment of display.

`backend/src/lib/money.ts` and `frontend/src/lib/money.ts` hold the conversion
and formatting. Field names carry the unit: `priceCentavos`, not `price`.

Quantity is different and is `numeric(12,3)`: produce genuinely sells in
fractional kilos. A line total is `round(unitPriceCentavos × quantity)`,
rounded once, at the end.

## Alternatives considered

**`numeric` columns and a decimal library.** Correct, and the usual answer for
financial software. It means a dependency on both sides and a wrapper type
through every layer, to handle amounts that never exceed a few thousand pesos
and never need more than two decimal places.

**Floats, and round for display.** The rounding is not the problem; the
accumulated error before the rounding is.

## Consequences

**Easier.** Sums are exact. Comparison and storage are trivial. A total
computed in the browser and one computed in the API agree by construction.

**Harder.** Every read and write needs the unit in mind, and forgetting a
conversion shows up as a price 100× off — loud, at least, rather than subtly
wrong. The `Centavos` suffix on field names exists to make that hard to miss.
