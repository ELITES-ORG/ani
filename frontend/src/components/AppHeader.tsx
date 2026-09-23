import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * The four destinations in the bottom bar. Everything else is a sub-page and
 * gets a back button.
 */
const TAB_ROUTES = new Set(['/', '/cart', '/orders', '/sell']);

const TITLES: Record<string, string> = {
  '/cart': 'Your basket',
  '/orders': 'Your orders',
  '/sell': 'Sell on Ani',
  '/sell/register': 'Register your farm',
  '/login': 'Sign in',
  '/register': 'Create an account',
};

/**
 * The leaf mark.
 *
 * The viewBox is cropped to the path's own bounds (x 19-46, y 16-42 of the
 * app icon's 64 grid). At the icon's full 0 0 64 64 the leaf fills under half
 * the box and reads as a smudge beside the wordmark.
 *
 * Two arcs and a midrib — the same shape as the app icon, so the thing on the
 * home screen and the thing at the top of the page are recognisably one
 * product. Drawn inline because at this size a request would cost more than
 * the path data.
 */
function LeafMark() {
  return (
    <svg viewBox="17 14 31 30" className="size-8 shrink-0" aria-hidden focusable="false">
      <path d="M46 16c0 16-11 26-27 26 0-16 11-26 27-26z" className="fill-accent-500" />
      <path
        d="M20.5 41.5 44.5 17.5"
        className="stroke-canvas"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const isTab = TAB_ROUTES.has(location.pathname);
  // Only home carries the wordmark. The other tabs are better off saying
  // which screen you are on than repeating the brand at someone who is
  // already inside the app.
  const isHome = location.pathname === '/';
  const dynamicTitle = usePageTitle();
  const title = dynamicTitle ?? TITLES[location.pathname];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur-sm">
      <div className="flex min-h-14 items-center gap-3 px-4">
        {isHome ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <LeafMark />
            <div className="min-w-0">
              <p className="text-xl font-extrabold leading-none tracking-tight text-ink">Ani</p>
              <p className="eyebrow mt-0.5 truncate text-[0.68rem]">Farm to table · Biliran</p>
            </div>
          </div>
        ) : (
          <>
            {/* A visible way back matters more than a tidy header. Not everyone
                knows the browser or Android back gesture exists — and a tab
                is reachable from the bar below, so it needs no arrow. */}
            {!isTab && (
              <button
                type="button"
                onClick={() => void navigate(-1)}
                aria-label="Go back"
                className="pressable -ml-2 flex size-11 shrink-0 items-center justify-center rounded-control text-ink active:bg-sunken"
              >
                <ArrowLeft size={22} aria-hidden />
              </button>
            )}
            <h1 className="min-w-0 truncate text-lg font-bold text-ink">{title ?? 'Ani'}</h1>
          </>
        )}
      </div>
    </header>
  );
}
