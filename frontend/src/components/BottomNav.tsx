import { NavLink } from 'react-router-dom';
import { Home, ShoppingBasket, Receipt, Store } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { to: '/', label: 'Browse', icon: Home, end: true },
  { to: '/cart', label: 'Cart', icon: ShoppingBasket, end: false },
  { to: '/orders', label: 'Orders', icon: Receipt, end: false },
  { to: '/sell', label: 'Sell', icon: Store, end: false },
];

/**
 * Bottom navigation, because this is a phone-first product used one-handed.
 * The thumb reaches the bottom of the screen; it does not reach the top.
 */
export function BottomNav({ cartCount }: { cartCount: number }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom,0px)]">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
              isActive ? 'font-semibold text-leaf-700' : 'text-ink-muted',
            )
          }
        >
          <item.icon size={20} aria-hidden />
          {item.label}
          {item.to === '/cart' && cartCount > 0 && (
            <span className="absolute right-[28%] top-1 min-w-4 rounded-full bg-leaf-700 px-1 text-[10px] leading-4 text-white">
              {cartCount}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
