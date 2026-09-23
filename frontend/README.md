# Ani — web

The React PWA. Installable to a phone's home screen; that is the whole
distribution strategy ([ADR 0002](../docs/decisions/0002-a-pwa-not-a-native-app.md)).

```bash
npm run dev        # http://localhost:5173, proxying /api to :4000
npm run build
npm run typecheck
npm run lint
npm test
```

Run the API alongside it (`npm run dev:api` from the root). Use the Vite
server rather than hitting :4000 directly — the proxy keeps the browser on one
origin, which is what makes the session cookie work.

## Layout

```
src/
├── components/ui/   primitives with no domain knowledge
├── components/      composed, app-aware pieces
├── features/<name>/ types + query hooks per feature
├── hooks/           cross-feature React state
├── lib/             api client, query client, cart, money, cn
├── pages/           route composition only
└── styles/          tokens, base
```

**Before writing UI, read [DESIGN.md](./DESIGN.md).** Tokens only.

## Things that will catch you out

**`@contracts/*` points at the backend.** Response types are defined once in
`backend/src/contracts/` and imported from here
([ADR 0008](../docs/decisions/0008-one-definition-of-an-api-shape.md)).

**Do not set `VITE_API_BASE_URL`.** The default relative `/api/v1` is what
keeps requests same-origin. Pointing it at a cross-origin host breaks sign-in.

**The service worker deliberately caches nothing.** It exists so Chrome will
offer an install prompt. Read
[ADR 0012](../docs/decisions/0012-the-service-worker-caches-nothing-yet.md)
before touching `public/sw.js`.

**Money is centavos.** Always render through `lib/money`.
