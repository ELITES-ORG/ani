/**
 * Peso amounts cross the API as integer centavos and are formatted only for
 * display. See backend/src/lib/money.ts for why they are never floats.
 */
export function formatPeso(centavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(centavos / 100);
}

/** "₱120.00 / kg" */
export function formatUnitPrice(centavos: number, unit: string): string {
  return `${formatPeso(centavos)} / ${unit}`;
}
