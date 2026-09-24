# 0019. Page changes are view transitions

- **Status:** Accepted. Supersedes the page-transition part of [0017](./0017-motion-is-css-only.md)
- **Date:** 2026-09-25

## Context

[ADR 0017](./0017-motion-is-css-only.md) animated page changes by keying the
route outlet on the pathname. The new page mounted at opacity 0 and rose into
place over 220ms.

On staging, every tab change looked like a glitch. A frame-by-frame recording
showed why:

- **The old page disappeared instantly**, and the new one started fully
  transparent. For the first frame after the tap, the screen between the
  header and the bottom bar was empty.
- **The header title and the tab highlight snapped** to the new page in that
  same frame, while the body was still invisible.

The effect was a blink, then a fade. 0017 had accepted that exit animations
were impossible, reasoning that entry motion alone would carry the
smoothness. The recording showed that it did not. The missing exit is exactly
the blank frame.

0017 had also already named the View Transitions API as "genuinely the right
tool", and deferred it only because of Safari support. Safari has shipped it
since 18.0, and Chrome on Android since 111.

## Decision

**Every in-app navigation is a view transition.**

- **One default for every navigation.** `lib/view-transitions.ts` sets
  `viewTransition` on the router itself, so every link, button and
  `navigate()` call gets it without remembering to ask. React Router replays
  the transition on back navigation, which covers the Android back gesture.
- **The page body fades through** (`motion.css`). The old page leaves over
  120ms. The new one rises 6px while it fades in, starting 40ms later. The two
  overlap, so the screen is never empty.
- **The header and the bottom bar are named**, so they hold still and only
  their contents cross-fade.
- **The active tab indicator is named on its own**, so it slides from the tab
  you left to the tab you tapped.
- **Reduced motion gets no transition at all**, not merely an un-animated one.
  Without animation, the two snapshots sit on top of each other for a frame
  and the old header shows through.
- **Browsers without view transitions** fall back to the keyed remount, with a
  transform-only settle and no fade from zero.

`<ScrollRestoration />` is added at the same time. A new page opens at the
top, and going back returns you to where you were in the list. Before this, a
product tapped halfway down the catalogue opened halfway down too.

## Alternatives considered

**Keep the keyed remount, but fade from partial opacity.** This shortens the
blink but cannot remove it: the old page is gone before the new one paints.

**Keep both pages mounted and animate between them** (hand-rolled, or with
Framer Motion's `AnimatePresence`). This gives real exit animations, but means
two live React trees during every navigation on a slow phone. It is also the
bundle weight 0017 rejected.

**Set `viewTransition` on each link individually.** That is twenty-odd call
sites, and every new one would silently fall back to a hard cut.

## Consequences

- **No extra JavaScript.** The browser does the work, and the only code is a
  wrapper around `router.navigate`.
- **The animation is compositor-only.** It is transform and opacity on
  snapshots, so the rule in 0017 still holds.
- **Taps are ignored during a transition.** For its roughly 260ms the page
  does not take input. That is short enough not to register, but a transition
  must never be lengthened past it.
- **`view-transition-name` must be unique on the page.** Only the *active* tab
  indicator carries its name. A second element with the same name aborts the
  transition, and the page changes without animation.
- **The router default is a wrapper around a library method.** A React Router
  upgrade that changes how `navigate` is called could bypass it. The tests in
  `lib/view-transitions.test.ts` would fail if it did.
