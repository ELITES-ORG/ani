# Add a UI component

Read [`frontend/DESIGN.md`](../../frontend/DESIGN.md) first. It is the
authority on tokens; this guide is about where things go.

---

## Where it belongs

| Kind | Location | Knows about |
|---|---|---|
| Primitive — button, input, spinner | `src/components/ui/` | Nothing. No domain concepts |
| Composed — product card, bottom nav | `src/components/` | App concepts, no data fetching |
| Feature-specific | `src/features/<name>/` | That feature's types and hooks |
| Route composition | `src/pages/` | Puts the above together |

A page composes; it does not fetch and transform and lay out and style. If a
page is doing all four, the middle two want to move.

## Data comes from a feature hook

```tsx
const query = useProducts({ category });

if (query.isPending) return <Spinner label="Loading produce" />;
if (query.isError) return <ErrorNotice error={query.error} onRetry={() => void query.refetch()} />;
if (query.data.data.length === 0) return <EmptyState title="Nothing here yet" … />;
```

**Never copy fetched data into `useState`.** That creates a second source of
truth that goes stale. Server state belongs to TanStack Query; `useState` is
for things the server does not know, like the contents of an input.

**Handle all four states.** Pending, error, empty, and loaded. Empty is a
normal state here and needs a way forward, not a dead end — see
[constraints §1](../explanation/constraints.md).

## Styling

Tokens only, from `src/styles/theme.css`:

```tsx
// Good
<div className="rounded-card border border-border bg-surface p-3">

// Wrong — raw colour, arbitrary radius
<div className="rounded-[7px] border border-[#e2e8dd] bg-white p-3">
```

**Never interpolate a Tailwind class name.** `` className={`text-${colour}`} ``
produces a class the compiler cannot see, so the CSS is never generated. Map
to whole class names instead.

## Phone first

- Minimum 44px on anything tappable
- Inputs at `text-base`, or iOS zooms the page on focus
- Animate `transform` and `opacity` only — layout animation stutters on
  budget Android
- Bottom-fixed elements need `env(safe-area-inset-bottom)`

---

## Checklist

- [ ] In the right folder for what it knows about
- [ ] Data from a feature hook, not `useState`
- [ ] Pending, error, empty, and loaded all handled
- [ ] Tokens only; no raw hex and no interpolated class names
- [ ] Tap targets at least 44px, inputs at `text-base`
- [ ] Checked at 360px wide
