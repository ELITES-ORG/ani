# Ani — API

Express 5 and Drizzle over Postgres.

```bash
npm run dev        # http://localhost:4000, watch mode
npm run build
npm run typecheck
npm run lint
npm test
```

Needs a database: from the repository root, `npm run db:up && npm run db:migrate
&& npm run db:seed`. Local Postgres listens on **5433**, not the default —
Bilikha's runs on 5432 and both need to be up at once.

## Layout

```
src/
├── config/     environment, validated once at boot
├── contracts/  response shapes shared with the frontend
├── db/         client, schema, seed
├── lib/        logger, AppError, money, password, session store
├── middleware/ cross-cutting request handling
├── modules/    features — router, validation, service
└── routes/     composition; the only place modules are mounted
```

Adding an endpoint: [docs/guides/add-an-api-endpoint.md](../docs/guides/add-an-api-endpoint.md).

## Things that will catch you out

**Relative imports end in `.js`**, even though the files are `.ts`. ESM with
`NodeNext`. Omitting the extension compiles cleanly and fails at runtime.

**No `asyncHandler`.** Express 5 forwards rejected promises to the error
handler itself. Do not add one.

**Throw `AppError`**, never hand-written error JSON. Every response is wrapped
in `data`.

**Money is integer centavos** ([ADR 0010](../docs/decisions/0010-money-is-integer-centavos.md)).
Quantities are `numeric` — produce sells in fractional kilos.

**Literal paths before `/:id`.** `/products/mine` is declared first, or it is
parsed as an id.
