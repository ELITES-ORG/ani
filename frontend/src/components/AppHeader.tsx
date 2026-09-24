import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleUser } from 'lucide-react';
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
  '/account': 'Your account',
};

/**
 * The mascot mark in the home header.
 *
 * Head crop with transparent background so it sits on the light canvas
 * without a black square. Sized explicitly: an unsized image in a flex row
 * reflows the wordmark sideways when it loads.
 */
function MascotMark() {
  return (
    <img
      src="/images/logos/top_navbar_logo.png"
      alt=""
      width={36}
      height={36}
      // Loaded eagerly and decoded off the main thread: it is above the fold
      // on every screen, so lazy-loading it only delays the header.
      decoding="async"
      className="size-9 shrink-0 object-contain"
    />
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
    <header className="vt-header sticky top-0 z-20 border-b border-border bg-canvas/95 backdrop-blur-sm">
      <div className="flex min-h-14 items-center gap-3 px-4">
        {isHome ? (
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <MascotMark />
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
            <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-ink">{title ?? 'Ani'}</h1>
          </>
        )}

        {/*
          Account is not a fifth tab (ADR 0013). On tab routes only: sub-pages
          already use this corner for the back arrow.
        */}
        {isTab && (
          <Link
            to="/account"
            aria-label="Your account"
            className="pressable -mr-2 flex size-11 shrink-0 items-center justify-center rounded-control text-ink active:bg-sunken"
          >
            <CircleUser size={22} aria-hidden />
          </Link>
        )}
      </div>
    </header>
  );
}
