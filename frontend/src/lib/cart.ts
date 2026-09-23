import type { ProductCard } from '@contracts/products';

export interface CartItem {
  productId: string;
  vendorId: string;
  farmName: string;
  name: string;
  unit: string;
  unitPriceCentavos: number;
  amount: number;
}

const STORAGE_KEY = 'ani.cart.v1';

/**
 * The cart lives in localStorage, not on the server.
 *
 * Someone assembling a basket on a dropping connection should not lose it,
 * and an anonymous browser should be able to fill one before signing in.
 */
export function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === null ? [] : (JSON.parse(raw) as CartItem[]);
  } catch {
    // Private mode, blocked storage, or corrupt JSON. An empty cart is a fine
    // fallback; throwing here would white-screen the app.
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Non-fatal: the cart still works for this session.
  }
}

export function addToCart(items: CartItem[], product: ProductCard, amount: number): CartItem[] {
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    return items.map((item) =>
      item.productId === product.id ? { ...item, amount: item.amount + amount } : item,
    );
  }
  return [
    ...items,
    {
      productId: product.id,
      vendorId: product.vendor.id,
      farmName: product.vendor.farmName,
      name: product.name,
      unit: product.unit,
      unitPriceCentavos: product.priceCentavos,
      amount,
    },
  ];
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceCentavos * item.amount, 0);
}

/**
 * An order belongs to one farm, so a basket spanning several becomes several
 * orders. Splitting here keeps that rule visible in the UI rather than only
 * surfacing as a validation error from the API.
 */
export function groupByVendor(items: CartItem[]): Map<string, CartItem[]> {
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    groups.set(item.vendorId, [...(groups.get(item.vendorId) ?? []), item]);
  }
  return groups;
}
