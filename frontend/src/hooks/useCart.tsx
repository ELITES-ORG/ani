import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ProductCard } from '@/features/products/types';
import { addToCart, cartTotal, readCart, writeCart, type CartItem } from '@/lib/cart';

interface CartContextValue {
  items: CartItem[];
  totalCentavos: number;
  add: (product: ProductCard, amount: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);

  const update = useCallback((next: CartItem[]) => {
    setItems(next);
    writeCart(next);
  }, []);

  const add = useCallback(
    (product: ProductCard, amount: number) => update(addToCart(readCart(), product, amount)),
    [update],
  );

  const remove = useCallback(
    (productId: string) => update(readCart().filter((item) => item.productId !== productId)),
    [update],
  );

  const clear = useCallback(() => update([]), [update]);

  const value = useMemo(
    () => ({ items, totalCentavos: cartTotal(items), add, remove, clear }),
    [items, add, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (context === null) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
}
