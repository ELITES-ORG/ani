import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useCart } from '@/hooks/useCart';

export function AppLayout() {
  const { items } = useCart();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-3">
        <h1 className="text-lg font-semibold tracking-tight text-leaf-700">Ani</h1>
        <p className="text-xs text-ink-muted">Farm to table, Biliran</p>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>

      <BottomNav cartCount={items.length} />
    </div>
  );
}
