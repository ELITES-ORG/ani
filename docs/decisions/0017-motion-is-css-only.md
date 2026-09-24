# 0017. Motion is a few keyframes, and never load-bearing

- **Status:** Accepted. The page transition is superseded by [0019](./0019-page-changes-are-view-transitions.md)
- **Date:** 2026-09-24

## Context

The interface needed to stop feeling flat and static. The usual answer is an
animation library — Framer Motion is around 40KB gzipped and would arrive on
every first load, on prepaid mobile data, for a phone whose main thread is
already the bottleneck.

The constraint that decides it: animating anything that triggers layout
stutters visibly on the hardware this runs on, and a stuttering animation
looks worse than none.

## Decision

Four keyframes and a handful of transitions, in `styles/motion.css`. No
library.

- **Page transition** — a 220ms rise, replayed by keying the route outlet on
  the pathname. Vertical, not horizontal: a slide implies a direction, and
  the wrong direction is more disorienting than no movement.
- **Staggered lists** — 35ms per item, capped at eight, so the last row never
  makes the app feel slow.
- **Press feedback** — `scale(0.975)`. On a slow connection this is often the
  only sign a tap registered, which is the difference between waiting and
  tapping five more times.
- **Loading** — an opacity pulse on skeletons, not a sweeping gradient: a
  moving highlight repaints a large area every frame.

Two rules, without exception:

1. **Transform and opacity only.**
2. **Nothing may depend on an animation having run.** `prefers-reduced-motion`
   switches all of it off globally, and the app has to be complete and usable
   in that state.

## Alternatives considered

**Framer Motion.** Better exit animations and gesture support. Neither is
needed, and the weight lands on exactly the people least able to afford it.

**View Transitions API.** Genuinely the right tool, and Safari support is not
yet broad enough for a population this iOS-light to justify the fallback path
as well. Worth revisiting.

## Consequences

Motion costs about 60 lines of CSS and nothing in JavaScript.

Exit animations are not possible — an element leaving the DOM simply goes.
Accepted: entry motion carries almost all of the perceived smoothness, and
the page transition covers the case people actually notice.
