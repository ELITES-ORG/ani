# Brand source art

`ani_logo.png` is the master artwork — 853×1280, 889KB. **It is deliberately
not under `frontend/public/`**: everything in that folder is copied into the
deploy as-is, and shipping a megabyte of source art is the exact thing
[constraints §2](../docs/explanation/constraints.md) warns about.

Everything the app serves is derived from it and committed under
`frontend/public/`.

## What is derived, and how

The app icon and header mark use a **crop of the head**, not the whole
mascot. A full-body character rendered into a 192px square leaves a head
about 35px tall, and Android draws the launcher icon smaller still — at that
size the whole bird is a smudge, while the head reads instantly. Full body is
kept for surfaces with room for it.

Crop box on the master: `(160, 75, 548, 560)`, then trimmed to its own alpha
bounds.

| File | What | Size |
|---|---|---|
| `icons/icon-192.png`, `icon-512.png` | Head on a `#00b464` plate, 22% corner radius, 10% padding | 6KB / 28KB |
| `icons/icon-maskable-*.png` | Same, full bleed, 22% padding so the mark stays inside the launcher's safe circle | 4KB / 17KB |
| `favicon.png` | 64px, same plate | 2KB |
| `images/logos/ani-mark.png` | Transparent head, 128px, rendered at 32px in the header | 5KB |
| `images/logos/ani-mascot.webp` | Full body, 360px tall, for empty states | 23KB |

All PNGs are quantised to 128 colours with `FASTOCTREE`, which is the only
Pillow quantiser that keeps the alpha channel — the rounded corners and the
transparent mark both need it. The artwork is flat vector-style, so this cost
nothing visually and removed 82% of the bytes.

## Regenerating

Requires Pillow. The crop box, plate colour and sizes above are the whole
specification; there is no build step, because these change roughly never and
a committed PNG is simpler than a pipeline nobody runs.

## A note on the greens

The mascot's own green is about `#008858`. The brand accent is `#00b464`
([ADR 0015](../docs/decisions/0015-dark-ink-on-the-brand-green.md)). They are
close but not identical, which is why the icon plate uses the accent and the
artwork keeps its own palette — recolouring the illustration to match would
flatten its shading.
