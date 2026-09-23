# 0012. The service worker caches nothing yet

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani is a PWA, and being installable is the entire distribution strategy — a
link shared in Messenger that becomes a home-screen icon
([ADR 0002](./0002-a-pwa-not-a-native-app.md)).

A site cannot offer its own Install button unless the browser fires
`beforeinstallprompt`, and Chrome only fires that for a site with a registered
service worker that has a `fetch` handler. So a worker is required.

The temptation is to make it useful while it is there: cache the app shell,
cache the catalogue, work offline. Connections here are genuinely unreliable,
so that is not a hypothetical benefit.

## Decision

Register a service worker whose `fetch` handler is empty. It never calls
`respondWith`, so every request goes to the network exactly as if no worker
existed. It caches nothing, and deletes any cache it finds on activation.

Ship a kill switch alongside it. `/sw-enabled` contains `on`, and the page
checks it on every start; publishing `off` unregisters the worker on every
device that opens the app, with no deploy. A `?sw=off` query parameter does
the same for one device. A failed fetch of the flag never reads as `off` — a
phone on a bad signal must not unregister the worker every time the connection
drops.

## Alternatives considered

**Cache the app shell and the catalogue now.** The obvious win, and what
`vite-plugin-pwa` would have configured in a few lines. Rejected on the
failure mode rather than the benefit: every cached response is a copy of an
old build that has to be invalidated correctly, and when that goes wrong the
result is a phone pinned to a broken version, belonging to someone who cannot
be talked through clearing site data over Messenger. A worker is the only code
Ani ships that outlives the page that installed it.

**No worker, relying on the browser's own install affordance.** It is buried
in a menu most people never open. Install is the strategy; it cannot depend on
that.

## Consequences

**Easier.** The install prompt works. The worker cannot break a request it
never touches, so a deploy always reaches an open tab.

**Harder.** No offline support at all, on connections that need it. That is
deferred, not abandoned — [plans/0004](../plans/0004-offline-catalogue.md)
covers doing it deliberately, with cache versioning and the update path
thought through rather than inherited from a plugin default.

**Do not make the fetch handler respond** without reading that plan. The
comment in `frontend/public/sw.js` says the same thing, at the place where
someone would be about to do it.
