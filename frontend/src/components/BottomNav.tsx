import { NavLink } from 'react-router-dom';
import { House, ShoppingBasket, ReceiptText, Store } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEMS = [
  { to: '/', label: 'Browse', Icon: House, end: true },
  { to: '/cart', label: 'Basket', Icon: ShoppingBasket, end: false },
  { to: '/orders', label: 'Orders', Icon: ReceiptText, end: false },
  { to: '/sell', label: 'Sell', Icon: Store, end: false },
];

/**
 * Bottom navigation, four destinations, always visible.
 *
 * Icons are never alone. An icon is a puzzle to someone who has not used many
 * apps, and a basket, a receipt and a shop are not self-evident. The word is
 * the label; the icon is decoration that helps once you already know.
 *
 * The active item gets three signals at once — a bar above it, a filled
 * background, and the accent colour — because any one of them alone is easy
 * to miss on a scratched screen in sunlight.
 */
export function BottomNav({ basketCount }: { basketCount: number }) {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface shadow-bar"
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map(({ to, label, Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'pressable relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 pt-1.5',
                  isActive ? 'text-accent-800' : 'text-ink-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'absolute inset-x-5 top-0 h-0.5 rounded-full transition-opacity duration-200',
                      isActive ? 'bg-accent-500 opacity-100' : 'opacity-0',
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'relative flex size-8 items-center justify-center rounded-full transition-colors duration-200',
                      isActive && 'bg-accent-50',
                    )}
                  >
                    <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
                    {to === '/cart' && basketCount > 0 && (
                      <span
                        className="tnum absolute -right-1.5 -top-1 min-w-[1.15rem] rounded-full bg-accent-600 px-1 text-[0.7rem] font-bold leading-[1.15rem] text-white"
                        aria-hidden
                      >
                        {basketCount}
                      </span>
                    )}
                  </span>
                  <span className={cn('text-xs', isActive ? 'font-extrabold' : 'font-semibold')}>
                    {label}
                  </span>
                  {to === '/cart' && basketCount > 0 && (
                    // The badge is decorative; this carries it to a screen reader.
                    <span className="sr-only">{basketCount} items in your basket</span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
