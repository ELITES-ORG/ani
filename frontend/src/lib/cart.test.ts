import { describe, expect, it } from 'vitest';
import { addToCart, cartTotal, groupByVendor, type CartItem } from './cart';
import type { ProductCard } from '@contracts/products';

function product(id: string, vendorId: string, priceCentavos = 2500): ProductCard {
  return {
    id,
    name: `Product ${id}`,
    category: 'vegetables',
    priceCentavos,
    unit: 'bundle',
    stockAmount: 100,
    imageUrl: null,
    vendor: { id: vendorId, farmName: `Farm ${vendorId}`, municipality: 'Naval', barangay: 'Poblacion' },
  };
}

function item(productId: string, vendorId: string, amount: number, price = 2500): CartItem {
  return {
    productId,
    vendorId,
    farmName: `Farm ${vendorId}`,
    name: `Product ${productId}`,
    unit: 'bundle',
    unitPriceCentavos: price,
    amount,
  };
}

describe('addToCart', () => {
  it('adds a product that is not there yet', () => {
    const result = addToCart([], product('p1', 'v1'), 2);
    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe(2);
  });

  it('increases the amount instead of duplicating the line', () => {
    const result = addToCart([item('p1', 'v1', 2)], product('p1', 'v1'), 3);
    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe(5);
  });

  it('keeps products from the same farm as separate lines', () => {
    const result = addToCart([item('p1', 'v1', 1)], product('p2', 'v1'), 1);
    expect(result).toHaveLength(2);
  });

  it('does not mutate the array it was given', () => {
    const original = [item('p1', 'v1', 2)];
    addToCart(original, product('p1', 'v1'), 3);
    expect(original[0]?.amount).toBe(2);
  });
});

describe('cartTotal', () => {
  it('is zero for an empty cart', () => {
    expect(cartTotal([])).toBe(0);
  });

  it('sums price times amount across lines', () => {
    expect(cartTotal([item('p1', 'v1', 2, 2500), item('p2', 'v1', 3, 1000)])).toBe(8000);
  });

  it('stays exact with fractional quantities', () => {
    // 0.1 + 0.2 in pesos would not be 0.3; in centavos it is exact.
    expect(cartTotal([item('p1', 'v1', 0.1, 1000), item('p2', 'v1', 0.2, 1000)])).toBe(300);
  });
});

describe('groupByVendor', () => {
  it('returns one group for a single-farm basket', () => {
    const groups = groupByVendor([item('p1', 'v1', 1), item('p2', 'v1', 1)]);
    expect(groups.size).toBe(1);
    expect(groups.get('v1')).toHaveLength(2);
  });

  it('splits a basket spanning farms, because an order belongs to one farm', () => {
    const groups = groupByVendor([item('p1', 'v1', 1), item('p2', 'v2', 1), item('p3', 'v1', 1)]);
    expect(groups.size).toBe(2);
    expect(groups.get('v1')).toHaveLength(2);
    expect(groups.get('v2')).toHaveLength(1);
  });

  it('is empty for an empty cart', () => {
    expect(groupByVendor([]).size).toBe(0);
  });
});
