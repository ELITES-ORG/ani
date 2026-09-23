# Operating constraints

Ani serves a province of roughly 180,000 people across eight municipalities.
Several decisions in this codebase look wrong by general web-development
instinct and are correct here. This page explains why, so they do not get
"fixed".

Read this before making a structural change.

---

## 1. Adoption is the binding constraint, not features

A two-sided marketplace is useless to buyers until farms list produce, and
useless to farms until buyers arrive. With a ceiling of 180,000 people, there
is no room to lose either side to friction.

**Consequences:**

- **Ani is a PWA, not a native app.** A link shared in a Messenger thread that
  opens a working app converts far better than one that opens a Play Store
  page asking for a 40MB download. That single difference outweighs everything
  native would have given us.
  ([ADR 0002](../decisions/0002-a-pwa-not-a-native-app.md))
- **Browsing requires no account.** Anything that puts a sign-up form in front
  of a first look at the catalogue costs more than the data it collects.
- **The cart survives a signed-out visitor.** It lives in `localStorage`, so
  someone can fill a basket, then sign in, and still have it.
- **Empty is a normal state, not an error.** Whole categories will be empty for
  months. Use `EmptyState` with a way forward, never a bare "no results".

## 2. Supply-side users are on budget Android over metered prepaid data

The farmer listing kamote is on a sub-₱5,000 handset with a data balance they
top up weekly. Android is roughly 89% of the Philippine market.

**Consequences:**

- **Images are the dominant performance risk**, not JavaScript. A listing of
  unresized 4MB phone photos makes the catalogue unusable no matter how fast
  the API is. Resize client-side before upload; never store originals on the
  app server.
- **Long stale times.** Reference data — municipalities, barangays — is
  `staleTime: Infinity`. Refetching the eight municipalities on a metered
  connection is pure waste.
- **Motion is transform and opacity only.** Animating layout properties
  stutters visibly on low-end hardware.
- **Forms must survive dropped connections.** Never require that the previous
  request succeeded before someone can continue.
- **Bottom navigation.** This is used one-handed, outdoors, often while
  carrying something. The thumb reaches the bottom of the screen.
  ([ADR 0013](../decisions/0013-bottom-navigation-on-phones.md))

## 3. Facebook is the distribution channel

Most traffic arrives from a shared post or a Messenger link, frequently inside
Facebook's in-app browser.

**Consequences:**

- **Every product must be a shareable URL with a working preview card.**
  Facebook's scraper does not execute JavaScript, so a client-rendered product
  page currently shares as a blank card. This is a distribution problem, not a
  nicety — see the debt section in [architecture](./architecture.md).
- **Test in Facebook's in-app webview.** It breaks things desktop Chrome never
  reveals.
- **The install prompt matters.** A worker with a `fetch` handler exists purely
  so Chrome will fire `beforeinstallprompt` and Ani can offer its own Install
  button. ([ADR 0012](../decisions/0012-the-service-worker-caches-nothing-yet.md))

## 4. Produce is not retail stock

What is being sold was alive last week and will be inedible next week.

**Consequences:**

- **Stock is fractional.** Produce sells in kilos and half-kilos, so
  `stock_amount` is `numeric`, not an integer. A schema that assumes whole
  units cannot express "2.5 kg of kamote".
- **Zero stock is a normal state, not a deletion.** A farm between harvests
  keeps the listing and unlists it. `is_listed` and `stock_amount` are separate
  for this reason.
- **Prices change between harvests.** Order lines copy the name, unit, and
  price at the moment of ordering. A vendor raising a price next week must
  never rewrite the history of an order already placed.
- **Orders are per-farm.** Fulfilment, cancellation, and payment all happen per
  farm, so a basket spanning two farms becomes two orders. Pretending otherwise
  produces an order that is half ready and half not.
  ([ADR 0009](../decisions/0009-an-order-belongs-to-one-farm.md))

## 5. Everyone knows everyone

In a province this size, the buyer and the seller are frequently one barangay
apart and know each other's cousins.

**Consequences:**

- **Contact details are not published.** A buyer's mobile number reaches the
  farm handling their order and no further.
- **No public ratings at MVP.** People will not leave honest criticism of a
  neighbour, so a five-star system degrades to all-fives and carries no signal
  while still being socially costly. If reputation is added later, read this
  paragraph first.
- **Vendors are reviewed before their produce is listed.** Every listing
  published sits under Ani's name, and there is no institution absorbing that
  risk. ([ADR 0011](../decisions/0011-vendors-are-reviewed-before-listing.md))

## 6. Location is a lookup, not a coordinate

Biliran has eight municipalities. It will not gain a ninth.

**Consequences:**

- **No PostGIS, no coordinate search, no map picker.** A municipality and
  barangay table answers every location question this product has: where is
  this farm, and can I realistically collect from it.
- **Barangay is required on a farm.** It is how a buyer judges whether pickup
  is worth the trip, and there is nothing else to fall back on.

## 7. Language is not only English

Biliran is Waray-speaking; Cebuano and Tagalog are both in use.

**Consequences:**

- **Search must tolerate local produce names.** People search for *kangkong*,
  not "water spinach". Log unmatched searches — they are the only honest
  evidence of what the catalogue is missing.
- **User-facing copy needs Filipino, ideally Waray.** English-only excludes
  exactly the farms hardest to reach.

---

## If you are about to

| …do this | …read this first |
|---|---|
| Suggest shipping a native app instead | Constraint 1 and ADR 0002 |
| Put a sign-up wall in front of browsing | Constraint 1 |
| Add PostGIS or a map picker | Constraint 6 |
| Store uploads on the API server | Constraint 2 |
| Animate width, height, or position | Constraint 2 |
| Make `stock_amount` an integer | Constraint 4 |
| Join order lines to products for the price | Constraint 4 |
| Let one order span several farms | Constraint 4 and ADR 0009 |
| Add public star ratings | Constraint 5 |
| Make the service worker cache responses | ADR 0012 |
