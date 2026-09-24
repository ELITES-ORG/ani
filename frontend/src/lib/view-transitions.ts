import type { createBrowserRouter } from 'react-router-dom';

type Router = ReturnType<typeof createBrowserRouter>;

/**
 * Makes every in-app navigation a view transition unless it opts out.
 *
 * React Router only cross-fades a navigation that passes `viewTransition`.
 * There are twenty-odd links, buttons and `navigate()` calls, and a page that
 * forgot the flag would fall back to a hard cut — so the default is set once
 * here, where the router is, rather than remembered at every call site.
 * `viewTransition: false` still opts a single navigation out.
 *
 * Back navigation needs nothing: the router replays the transition for any
 * pair of routes it has already transitioned between, which covers the browser
 * back button and Android's back gesture as well as `navigate(-1)`.
 *
 * Where the browser has no `startViewTransition`, the router ignores the flag
 * and simply renders — see `motion.css` for what that fallback looks like.
 *
 * Someone who has asked for reduced motion gets no transition at all, rather
 * than one with its animations switched off: un-animated, the old and new
 * snapshots sit on top of each other for a frame or two and the old header
 * shows through the new one. Read per navigation, so changing the setting
 * takes effect without a reload.
 */
export function withViewTransitions(router: Router): Router {
  const navigate = router.navigate;
  router.navigate = ((to: Parameters<Router['navigate']>[0], opts?: Parameters<Router['navigate']>[1]) =>
    typeof to === 'number'
      ? navigate(to)
      : navigate(to, {
          ...opts,
          viewTransition: opts?.viewTransition ?? !prefersReducedMotion(),
        })) as Router['navigate'];
  return router;
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
