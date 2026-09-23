/**
 * Peso amounts are integers of centavos everywhere — database, API, and UI.
 *
 * Floating point money is wrong by construction: 0.1 + 0.2 !== 0.3, and a
 * marketplace that adds up order lines in floats produces totals that are off
 * by a centavo and cannot be reconciled against what a buyer was shown.
 */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/** Renders as "₱1,250.00". */
export function formatPeso(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(centavosToPesos(centavos));
}

/**
 * A line total, rounded once at the end.
 *
 * Produce sells in fractional kilos, so quantity is not an integer and the
 * product of price and quantity usually is not either.
 */
export function lineTotal(unitPriceCentavos: number, quantity: number): number {
  return Math.round(unitPriceCentavos * quantity);
}
