# 0015. Dark ink on the brand green

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

The brand accent is `#00b464`. Measured against WCAG:

| Pair | Contrast | Verdict |
|---|---|---|
| `#00b464` text on white | 2.7:1 | Fails AA for any text |
| White text on `#00b464` | 2.7:1 | Fails AA for any text |
| Ink `#15211a` on `#00b464` | 6.2:1 | Passes AA and AAA for large text |
| `#007e45` text on white | 5.2:1 | Passes AA |

So the obvious treatment — a green button with white text, and green links —
is unreadable by the standard, and worse than the numbers suggest in the
conditions this app is actually used in: a scratched budget phone held at
arm's length in Philippine daylight.

## Decision

The brand green is a **fill**, never a text colour on a light background.

- Primary buttons, active chips and indicators: `accent-500` filled, with
  **near-black ink** for any text on top.
- Accent-coloured text on light backgrounds: `accent-700`.
- Status and meaning are never carried by colour alone; every status pill has
  a dot and a word.

## Alternatives considered

**Darken the brand to make white text work.** White on `#007e45` clears 4.5:1,
so a green-with-white button is available. Rejected because it means the
colour people see most is not the brand colour, and the darker green reads as
corporate rather than fresh.

**Keep white on `#00b464` and accept the contrast.** The population using this
skews older and outdoors. This is the wrong product to spend accessibility on
for the sake of a convention.

## Consequences

The primary button is vivid green with black text, which is both more legible
and more distinctive than the white-on-green default — it looks like a
decision rather than a template.

The cost is a rule everyone has to remember: `accent-500` for fills,
`accent-700` for text. The tokens are named and commented so the wrong one is
at least visible in review, but nothing enforces it automatically.
