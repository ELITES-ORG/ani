import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { useCart } from '@/hooks/useCart';

export function AppLayout() {
  const { items } = useCart();
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {/*
        A new page opens at the top, and going back returns to where you were
        in the list. Without this a tap on a product halfway down the catalogue
        opened the product page halfway down too, which reads as broken.
      */}
      <ScrollRestoration />

      <AppHeader />

      {/*
        Page changes are view transitions (lib/view-transitions.ts, motion.css):
        the old page fades out while the new one rises in, so there is never a
        blank frame between them.

        The key and `page-enter` are the fallback for a browser without view
        transitions. Keyed on the path, React mounts the new page fresh and the
        entry animation replays; `motion.css` switches it off where the view
        transition already does the work, so it never plays twice.
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
