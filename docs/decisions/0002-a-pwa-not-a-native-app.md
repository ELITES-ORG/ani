# 0002. Build Ani as a PWA, not a native app

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani is a two-sided marketplace for one province. Biliran has roughly 180,000
people across eight municipalities, and the realistic addressable audience is
a fraction of that. A marketplace is worthless to buyers until farms list
produce and worthless to farms until buyers arrive, so the launch risk is
adoption, not capability.

What is true of the people on both sides:

- Android is about 89% of the Philippine smartphone market, and the supply
  side in particular is on entry-level handsets under ₱5,000.
- Smartphones are the primary internet device for over 90% of Filipino users.
  Data is prepaid and metered.
- Discovery happens on Facebook and in Messenger threads, not in app store
  search. A province-exclusive app gains nothing from store ranking.
- Vendor onboarding is face to face, at a market, on whatever connection is
  available.

An initial plan had this as a Flutter app with a Dart backend. That was
reconsidered before any of it shipped.

## Decision

Ani is a Progressive Web App: React and TypeScript, served from Vercel,
installable to the home screen.

If a Play Store listing is wanted later, the same codebase ships as a Trusted
Web Activity rather than being rewritten.

## Alternatives considered

**Native, or Flutter targeting both platforms.** Better push notifications,
better offline, and a store listing that acts as a legitimacy signal — "is
this real?" is a fair question when money is involved. It loses on the thing
that decides the outcome: every install step costs conversions this population
cannot spare. Getting a farmer at a market to scan a QR code and tap "Add to
Home Screen" works on a weak connection; getting them to find a Play Store
listing and download 40MB often does not. Push, the strongest argument, was
judged not critical for MVP — early order volume is low enough that a vendor
checking the app is honest.

**Flutter for both mobile and web from one codebase.** Tempting, and rejected:
Flutter Web renders to canvas and ships a heavy initial payload, which attacks
the exact fast-first-load advantage that makes a PWA worth choosing. It would
have kept the appearance of the decision while discarding its substance.

**Serverpod or another Dart backend.** Genuinely strong if the client is
Flutter — one language, shared models, generated type-safe clients. Once the
client is TypeScript, that entire benefit disappears.

## Consequences

**Easier.** A shared link is the whole install flow. Deploying updates them
all at once, with no store review and no users stranded on old versions —
which matters while the product changes weekly on vendor feedback. Hosting is
a Vercel free tier.

**Harder.** Push notifications on iOS require the user to install to the home
screen first, though at 11% of the market that is a small exposure. There is
no store listing to point at for credibility. Offline has to be built
deliberately rather than inherited.

**The cost we are accepting.** Facebook's scraper does not execute JavaScript,
so a shared product link currently renders as a blank preview card. For a
product whose distribution *is* Facebook, that is a real problem and it is
recorded as debt in [architecture](../explanation/architecture.md) rather than
pretended away. It needs SSR or prerendering for the public routes before any
serious push for adoption.
