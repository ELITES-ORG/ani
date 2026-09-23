import { describe, expect, it } from 'vitest';
import { centavosToPesos, formatPeso, lineTotal, pesosToCentavos } from './money.js';

describe('pesosToCentavos', () => {
  it('converts whole pesos', () => {
    expect(pesosToCentavos(25)).toBe(2500);
  });

  it('converts the fractions a price actually takes', () => {
    expect(pesosToCentavos(25.5)).toBe(2550);
    expect(pesosToCentavos(0.05)).toBe(5);
  });

  it('converts any two-decimal price exactly', () => {
    for (const pesos of [0.01, 0.99, 1.1, 1.15, 19.99, 250.75, 1999.95]) {
      expect(pesosToCentavos(pesos)).toBe(Math.round(pesos * 100));
      expect(Number.isInteger(pesosToCentavos(pesos))).toBe(true);
    }
  });

  it('cannot rescue a price with more precision than centavos', () => {
    // Documenting a real limit, not asserting a feature. 1.005 is already
    // 1.00499999999999989 by the time this function sees it, so it rounds to
    // 100 rather than 101. Nothing here can recover the intent — the value was
    // lost before the call.
    //
    // It does not matter in practice: produce is priced in pesos and
    // fifty-centavo steps, and the API accepts pricePesos as JSON, where a
    // third decimal place would be a data-entry error rather than a price.
    expect(pesosToCentavos(1.005)).toBe(100);
  });
});

describe('lineTotal', () => {
  it('multiplies a whole quantity exactly', () => {
    expect(lineTotal(2500, 3)).toBe(7500);
  });

  it('handles the fractional kilos produce is sold in', () => {
    expect(lineTotal(6000, 2.5)).toBe(15000);
    expect(lineTotal(6000, 0.25)).toBe(1500);
  });

  it('rounds once, at the end', () => {
    // 3333 * 3 = 9999 exactly; the point is that it never becomes 9998.999…
    expect(lineTotal(3333, 3)).toBe(9999);
    expect(lineTotal(3333, 0.333)).toBe(1110);
  });

  it('is exact where a float sum would not be', () => {
    // The canonical failure: 0.1 + 0.2 !== 0.3. In centavos it is 10 + 20.
    const sum = lineTotal(1000, 0.1) + lineTotal(1000, 0.2);
    expect(sum).toBe(300);
  });
});

describe('centavosToPesos', () => {
  it('is the inverse for representable amounts', () => {
    expect(centavosToPesos(pesosToCentavos(123.45))).toBe(123.45);
  });
});

describe('formatPeso', () => {
  it('renders pesos with a currency symbol and two decimals', () => {
    const formatted = formatPeso(125000);
    expect(formatted).toContain('1,250.00');
  });

  it('renders zero rather than an empty string', () => {
    expect(formatPeso(0)).toContain('0.00');
  });
});
