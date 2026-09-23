# Ani design system

Read this before writing UI. It is not a style suggestion — the rules here
exist because of who uses Ani and on what.

The audience is holding a sub-₱5,000 Android phone, one-handed, often outdoors
in daylight, on prepaid data they are counting. Every rule below follows from
that. Background: [operating constraints](../docs/explanation/constraints.md).

---

## Tokens only

Every colour, radius, and font comes from `src/styles/theme.css`. There are no
exceptions, and a one-off is always a token that has not been added yet.

```tsx
// Good
<div className="rounded-card border border-border bg-surface p-3">

// Wrong
<div className="rounded-[7px] border border-[#e2e8dd] bg-white p-3">
```

**Never interpolate a Tailwind class name.**

```tsx
// Broken: the compiler cannot see this class, so the CSS is never generated
<span className={`text-${tone}-700`}>

// Correct: map to whole class names
const TONE = { leaf: 'text-leaf-700', danger: 'text-danger-500' } as const;
<span className={TONE[tone]}>
```

## Colour

| Token | Use |
|---|---|
| `canvas` | Page background |
| `surface` | Cards, bars, inputs |
| `border` | Every divider and outline |
| `ink` | Primary text |
| `ink-muted` | Secondary text, labels |
| `ink-subtle` | Disabled, placeholder |
| `leaf-700` | Primary action, active nav, price |
| `leaf-100` / `leaf-50` | Status pills, pressed states |
| `danger-500` / `danger-50` | Destructive actions and errors |
| `soil-500` | Reserved for a second category accent |

Greens carry meaning here — fresh, available, confirmed. Do not use `leaf` for
a neutral surface, or the signal stops working.

**Contrast.** `ink` on `canvas` and white on `leaf-700` both clear 4.5:1. This
is read in sunlight; a mid-grey that looks refined on a desk monitor is
illegible on a cheap LCD outdoors. Never put `ink-subtle` on anything a user
must read.

## Type

System font stack — no webfont. A font file is bytes a farmer pays for, to
change the shape of letters.

| Use | Classes |
|---|---|
| Page title | `text-lg font-semibold` |
| Section heading | `text-sm font-medium text-ink-muted` |
| Body | `text-base` |
| Secondary | `text-sm text-ink-muted` |
| Caption | `text-xs text-ink-muted` |

**Every input is `text-base`.** Anything smaller makes iOS Safari zoom the
page when the field takes focus, and the user has to pinch back out.

## Space and shape

Multiples of 4, via Tailwind's scale. `gap-2` within a group, `gap-3` between
cards, `gap-6` between sections.

| Token | Use |
|---|---|
| `rounded-card` | Cards, images, panels |
| `rounded-control` | Buttons, inputs, selects |
| `rounded-full` | Pills and badges only |

## Touch

**44px minimum** on anything tappable — `min-h-11`. This is used while holding
a basket.

Primary actions are full width. A thumb finds an edge-to-edge button without
aiming.

Destructive actions are never adjacent to their common neighbour. Remove sits
apart from quantity.

## Motion

**Transform and opacity only.** Animating `width`, `height`, `top`, or
`margin` forces layout on every frame and visibly stutters on budget hardware.

Keep it under 200ms. `prefers-reduced-motion` is honoured globally in
`styles/base.css`; do not opt a component out of it.

## The four states

Every screen that loads data handles all four. Missing one is the most common
review comment.

| State | Component |
|---|---|
| Pending | `<Spinner label="Loading produce" />` |
| Error | `<ErrorNotice error={…} onRetry={…} />` |
| Empty | `<EmptyState title="…" description="…" action={…} />` |
| Loaded | The content |

**Empty is normal, not a failure.** Whole categories will be empty for months.
An `EmptyState` always offers a way forward — browse everything, register a
farm, try another category. A bare "no results found" is a dead end and reads
as a broken app.

## Images

Product photos are the dominant performance risk, not JavaScript.

- `loading="lazy"` and `decoding="async"` on everything below the fold
- A fixed aspect ratio, so the list does not reflow as images arrive
- A `leaf-100` block when there is no photo — never a broken image icon
- Resize client-side before upload ([plan 0002](../docs/plans/0002-product-photos.md))

## Layout

Design at **360px** and let it grow. If it only works at 390, it is broken for
a large share of the audience.

Bottom navigation is fixed and always visible
([ADR 0013](../docs/decisions/0013-bottom-navigation-on-phones.md)). Page
content carries `pb-24` to clear it, and anything bottom-fixed respects
`env(safe-area-inset-bottom)`.

## Money

Always through `formatPeso` or `formatUnitPrice` from `lib/money`. Never
interpolate a raw number with a peso sign — the value is centavos and the
result will be 100× wrong.

Prices are `font-semibold text-leaf-700`. It is the number people are
scanning for.

---

## Before you open a pull request

- [ ] No raw hex, arbitrary radius, or interpolated class name
- [ ] Tap targets `min-h-11`; inputs `text-base`
- [ ] All four data states handled
- [ ] `EmptyState` offers a way forward
- [ ] Animation is transform or opacity only
- [ ] Checked at 360px wide
- [ ] Money rendered through `lib/money`
