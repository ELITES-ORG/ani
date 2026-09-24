# Ani design system

Read this before writing UI. It is not a style guide with opinions in it —
most of these rules exist because of who uses Ani and on what.

The person on the other end is holding a sub-₱5,000 Android phone, one-handed,
often outdoors in daylight, on prepaid data they are counting, and they may
never have filled in a web form before. Everything below follows from that.

Background: [operating constraints](../docs/explanation/constraints.md).

---

## The one rule that outranks the rest

**If a change makes a screen more elegant and less obvious, it is the wrong
change.** ([ADR 0016](../docs/decisions/0016-the-interface-assumes-no-app-literacy.md))

---

## Tokens only

**`base.css` and `motion.css` are imported into Tailwind's layers**
(`index.css`). Never add an unlayered rule for an element: unlayered CSS beats
every utility whatever its specificity. An unlayered `button { font: inherit }`
once made every button in the app render at body weight, whatever its classes
said.

Every colour, size, radius, shadow and easing comes from
`src/styles/theme.css`. A one-off is always a token that has not been added
yet.

```tsx
// Good
<div className="rounded-card border border-border bg-surface p-3">

// Wrong — raw colour, arbitrary radius
<div className="rounded-[7px] border border-[#e1e6da] bg-white p-3">
```

**Never build a class name by interpolation.**

```tsx
// Broken: the compiler cannot see this class, so the CSS is never generated
<span className={`text-${tone}-700`}>

// Correct: map to whole class names
const TONE = { good: 'text-accent-700', bad: 'text-danger' } as const;
<span className={TONE[tone]}>
```

---

## Colour

One accent, `#00b464`, and warm neutrals. The greys are tinted green rather
than the usual cold slate, so they sit with the accent and with photographs of
vegetables.

| Token | Use |
|---|---|
| `canvas` | Page background |
| `surface` | Cards, bars, inputs |
| `sunken` | Wells, skeletons, inactive chips |
| `border` / `border-strong` | Dividers / input outlines |
| `ink` | Primary text |
| `ink-muted` | Secondary text, labels |
| `ink-subtle` | **Placeholders and disabled only.** Never body copy |
| `accent-500` | The brand. **Fills only** |
| `accent-700` / `accent-800` | Accent **text** on light backgrounds |
| `accent-50` / `accent-100` | Tinted panels, active chip backgrounds |
| `warn` / `warn-soft` | Waiting, under review |
| `danger` / `danger-soft` | Destructive actions and errors |

### The accent rule

`#00b464` on white is **2.7:1**. It fails AA for text, and white on it fails
equally. So:

- **Green is a fill, never text on a light background.** Accent text uses
  `accent-700`.
- **Text on the green fill is near-black ink** (6.2:1), not white.

That is why the primary button is vivid green with black text. It is the
accessible choice and it is more legible in sunlight.
([ADR 0015](../docs/decisions/0015-dark-ink-on-the-brand-green.md))

**Colour never carries meaning alone.** Every status pill has a dot *and* a
word. Roughly one man in twelve cannot separate red from green.

---

## Type

Figtree, self-hosted, one variable file covering 400–900
([ADR 0018](../docs/decisions/0018-one-self-hosted-variable-font.md)).

| Use | Classes |
|---|---|
| Screen title | `text-2xl font-extrabold` |
| Section heading | `text-lg font-bold` |
| Quiet group label | `.eyebrow` (uppercase, tracked, muted) |
| Body | `text-base` |
| Secondary | `text-sm text-ink-muted` |
| Price | `tnum text-lg font-extrabold text-accent-800` |
| Action label | `font-bold tracking-control` — `Button` applies it |
| Inline link | `font-bold text-accent-700 underline decoration-accent-400 decoration-2 underline-offset-4` |

**Anything you press is bold.** A semibold label on a coloured box reads as
text that happens to sit there; bold reads as a thing to tap. Field labels are
semibold, so the button is always one step above them.

Weights carry the hierarchy, not sizes. There are six sizes on purpose — more
steps means *less* hierarchy, not more.

**Every input is `text-base`.** Anything smaller makes iOS zoom the page on
focus and the user has to pinch back out. This is a correctness rule.

**Numbers that get compared use `.tnum`** — tabular figures, so prices line up
down a column.

---

## Space and shape

Multiples of 4, through Tailwind's scale. `gap-2` inside a group, `space-y-3`
between cards, `space-y-5`–`space-y-6` between sections.

| Token | Use |
|---|---|
| `rounded-control` | Buttons, inputs, selects |
| `rounded-card` | Cards, images, panels |
| `rounded-sheet` | Dialogs |
| `rounded-full` | Pills and badges only |

Shadows are shallow and tinted with ink, never black. `shadow-card` on resting
surfaces, `shadow-dialog` on modals. The primary button uses `shadow-control`
— a lit top edge and a darker bottom lip, so it reads as a key rather than a
flat slab — and swaps to `shadow-control-pressed` while held. Secondary uses
`shadow-control-quiet`. A heavy drop shadow is the fastest way to
look like a template.

---

## Touch

- **48px minimum** on anything tappable (`min-h-12`); 56px for the primary
  action and the quantity steppers
- Primary actions are **full width**
- On a long screen, the primary action is **sticky** (`.sticky-action`) so it
  is never something you have to go looking for
- Destructive controls are never adjacent to their common neighbour

---

## Motion

`src/styles/motion.css`. No animation library
([ADR 0017](../docs/decisions/0017-motion-is-css-only.md)).

| Class | Use |
|---|---|
| `page-enter` | 220ms rise. Applied by `AppLayout`, keyed on the route |
| `stagger` | Children enter 35ms apart, capped at eight |
| `pressable` | Press feedback, `scale(0.975)` |
| `animate-pulse-soft` | Skeleton loading |

Two rules, no exceptions:

1. **Transform and opacity only.** Animating layout stutters visibly on this
   hardware.
2. **Nothing may depend on an animation.** `prefers-reduced-motion` turns all
   of it off globally, and the app must be complete in that state.

---

## The four states

Every screen that loads data handles all four. Missing one is the most common
review comment.

| State | Component |
|---|---|
| Pending | `<Spinner label="Loading produce" />` or `<ProductListSkeleton />` |
| Error | `<ErrorNotice error={…} onRetry={…} />` |
| Empty | `<EmptyState title=… description=… action=… />` |
| Loaded | The content |

**Always name what is loading.** "Loading produce" says the app is working
and on what; a bare spinner says nothing, and that is when people decide it is
broken.

**Empty is normal, not a failure.** Whole categories will be empty for months.
An `EmptyState` always offers a way forward.

---

## Forms

- Label visible above the control, always. Never placeholder-as-label
- A hint under the label explains the format *before* anyone gets it wrong
- Mark **optional**, not required — most fields here are required
- **Never disable the submit button.** Let the browser block the submit and
  focus the offending field. `disabled` is only for "already submitted"
- Passwords get a show/hide toggle. Typing one blind on a phone keyboard is
  why sign-in fails twice in a row
- Numbers use `QuantityStepper`, not a text field
- Anything irreversible goes through `ConfirmDialog` first

---

## Copy

Write what you would say out loud to someone at a market.

| Instead of | Write |
|---|---|
| "Pending" | "Waiting for the farm to confirm" |
| "No results found" | "Nothing matched. Try another word." |
| "Error 500" | "That did not work. Please try again." |
| "Submit" | "Send for review" |
| "Are you sure?" | "Empty your basket? Everything in it will be removed." |

Never show an error code. It means nothing to the reader and makes the app
feel like it is talking to someone else.

---

## The mark

Ani's mark is a rooster mascot. Which version to use depends entirely on how
much room there is.

| Surface | Asset | Why |
|---|---|---|
| Header, favicon, app icon | **Head crop** — `images/logos/ani-mark.png`, `icons/*` | At 32–48px the whole bird is a smudge. The head reads instantly |
| Empty states with room | **Full body** — `images/logos/ani-mascot.webp` | 360px tall, 23KB |

Source art and the exact crop are documented in
[`brand/README.md`](../brand/README.md). The master PNG is **not** under
`public/` — everything there is copied into the deploy as-is.

**The mascot is not a product placeholder.** A product with no photo gets a
leaf icon on a tinted block. A rooster on every photo-less vegetable would be
noise, and it would stop the mark meaning "Ani".

## Images

Product photos are the dominant performance risk, not JavaScript.

- `loading="lazy"` and `decoding="async"` below the fold
- Explicit dimensions or aspect ratio, so the list does not reflow
- `.photo` on product imagery for the grey loading block. **Not** on logos or
  anything with transparency — the background never goes away
- No photo → a tinted block with a leaf icon, never a broken image
- Never an emoji as a placeholder

---

## Layout

Design at **360px** and let it grow. Content is capped at `max-w-lg` and
centred, so a tablet does not stretch a phone layout across the screen.

Bottom navigation is fixed. Scrolling content carries `.pad-for-nav` to clear
it, and anything bottom-fixed respects `env(safe-area-inset-bottom)`.

---

## Looking at it

There is no Playwright here. `scripts/screenshot.mjs` drives headless Chrome
over CDP with no dependencies:

```bash
node scripts/screenshot.mjs '{"url":"http://127.0.0.1:5173/","out":"shot.png","w":390,"h":844}'
```

It takes `seed` to write localStorage before first paint, `cookies` for a
signed-in screen, and `click` to shoot a screen after an interaction.

It does **not** replace a real phone. Font rendering, the actual address bar
and safe-area insets are not the real thing.

---

## Before you open a pull request

- [ ] No raw hex, arbitrary radius, or interpolated class name
- [ ] Tap targets `min-h-12`; every input `text-base`
- [ ] All four data states handled
- [ ] `EmptyState` offers a way forward
- [ ] No disabled submit button
- [ ] Irreversible actions confirm first
- [ ] Status has a word, not only a colour
- [ ] Animation is transform or opacity only
- [ ] Money rendered through `lib/money`
- [ ] Checked at 360px wide
