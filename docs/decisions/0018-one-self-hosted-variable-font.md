# 0018. One self-hosted variable font

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

Ani shipped with the system font stack, which costs nothing to download and
looks like every other web app — including, specifically, like something
generated rather than designed.

Against that, [constraints §2](../explanation/constraints.md) is explicit
that these users are on metered prepaid data, and a font is bytes somebody
pays for to change the shape of letters.

## Decision

One variable font, Figtree, self-hosted as woff2 and split by subset.

- **20KB** for `latin`, preloaded, which covers every screen
- **10KB** for `latin-ext`, downloaded only if a page contains those
  characters
- `font-display: swap`, so text is readable before the font arrives
- One file spans weights 400–900, so the whole hierarchy costs one request

Figtree specifically: a tall x-height and open apertures, which hold up at
small sizes on a cheap panel, and enough warmth to suit produce without
being a novelty face. Deliberately not Inter or Poppins — the first is the
default of every AI-generated interface, the second of every Philippine
template.

## Alternatives considered

**Keep the system stack.** Free, and it renders differently on every device,
which makes a consistent hierarchy impossible to tune. It is also the single
biggest contributor to an interface looking unconsidered.

**Google Fonts over their CDN.** No bytes saved — the file is the same size —
and it adds a third-party connection on the critical path, a privacy
question, and a dependency on a host that is blocked in some networks.

**Two families, one for display.** More character, twice the bytes. One
family carrying weight 400 to 900 gives enough hierarchy.

## Consequences

20KB on first load, cached from then on. About the size of one small product
photo, and less than the images on any screen that has them.

`font-display: swap` means a brief flash of the fallback on a cold load. That
is the right trade: text that can be read immediately in the wrong typeface
beats an empty screen in the right one.
