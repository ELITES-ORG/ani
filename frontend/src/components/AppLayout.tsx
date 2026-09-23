import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { useCart } from '@/hooks/useCart';

export function AppLayout() {
  const { items } = useCart();
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader />

      {/*
        Keyed on the path, so React throws the old subtree away and the new one
        mounts fresh — which is what replays the entry animation on every
        navigation. A 220ms rise, no horizontal slide: a slide implies a
        direction, and the wrong direction is worse than none.
      */}
      <main key={location.pathname} className="page-enter pad-for-nav flex-1 px-4 py-4">
        <div className="mx-auto max-w-lg">
          <Outlet />
        </div>
      </main>

      <BottomNav basketCount={items.length} />
    </div>
  );
}
