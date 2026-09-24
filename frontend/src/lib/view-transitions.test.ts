import { describe, expect, it, vi } from 'vitest';
import { createMemoryRouter } from 'react-router-dom';
import { withViewTransitions } from './view-transitions';

const ROUTES = [{ path: '/' }, { path: '/cart' }, { path: '/orders' }];

/** Navigates and reports whether the router asked for a view transition. */
function transitionsOn(
  router: ReturnType<typeof withViewTransitions>,
  go: () => Promise<void>,
): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = router.subscribe((_state, { viewTransitionOpts }) => {
      if (router.state.navigation.state !== 'idle') return;
      unsubscribe();
      resolve(viewTransitionOpts !== undefined);
    });
    void go();
  });
}

describe('withViewTransitions', () => {
  it('transitions a navigation that did not ask for one', async () => {
    const router = withViewTransitions(createMemoryRouter(ROUTES));
    expect(await transitionsOn(router, () => router.navigate('/cart'))).toBe(true);
  });

  it('keeps the other options it was given', async () => {
    const router = withViewTransitions(createMemoryRouter(ROUTES));
    await transitionsOn(router, () => router.navigate('/cart', { replace: true }));
    expect(router.state.historyAction).toBe('REPLACE');
  });

  it('lets a single navigation opt out', async () => {
    const router = withViewTransitions(createMemoryRouter(ROUTES));
    expect(
      await transitionsOn(router, () => router.navigate('/cart', { viewTransition: false })),
    ).toBe(false);
  });

  it('does not transition for someone who asked for reduced motion', async () => {
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockReturnValue({ matches: true } as MediaQueryList);
    try {
      const router = withViewTransitions(createMemoryRouter(ROUTES));
      expect(await transitionsOn(router, () => router.navigate('/cart'))).toBe(false);
      expect(spy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    } finally {
      spy.mockRestore();
    }
  });

  it('replays the transition going back', async () => {
    const router = withViewTransitions(createMemoryRouter(ROUTES));
    await transitionsOn(router, () => router.navigate('/orders'));
    expect(await transitionsOn(router, () => router.navigate(-1))).toBe(true);
    expect(router.state.location.pathname).toBe('/');
  });
});
