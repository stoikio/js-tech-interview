# Stoïk Lite

Brokers create prospects, configure cyber insurance quotes and validate them, which signs them and creates contracts. There is no login: anyone can edit any quote. Domain language: [GLOSSARY.md](GLOSSARY.md).

## Layout

```
apps/api        NestJS API: bounded contexts, see apps/api/AGENTS.md
apps/client     React + Vite UI (port 3000), proxies /api to the API
```

## Stack

| Concern       | Choice                                                              |
| ------------- | ------------------------------------------------------------------- |
| API           | NestJS 12, Prisma 7 (PostgreSQL 17), zod                            |
| Client        | React 19, Vite 8, Tailwind 4, Base UI, TanStack Query, React Router |
| Tests         | Jest (API unit and e2e with Supertest), Vitest (client)             |
| Lint / format | oxlint (`oxlint.config.mts`), oxfmt (`.oxfmtrc.jsonc`)              |

## Commands

```bash
pnpm dev            # Postgres + migrations + seed (if empty) + api and client
pnpm db:reset       # drop, migrate and seed again
pnpm test           # API and client unit tests
pnpm test:e2e       # API e2e tests, on the stoik_lite_test database
pnpm typecheck
pnpm lint
pnpm format
```

New migration: `pnpm --filter @stoik-lite/api db:migrate --name <name>`.

## Rules that apply everywhere

- Money is an integer number of cents, in fields ending with `Cents`. The client never computes a price.
- Use the words of the glossary in code, UI and docs.
- Seed data is fictional and every seeded date is relative to today.
- No `any`, no non-null assertion (`!`). Comments explain why, not what.
- Client pages read and change the API's data through `src/lib/server-state.ts` only: it owns the query keys and what goes stale after each change, so a page never writes a query key.
- Client UI is built from `apps/client/src/ui/` (generic components) and `src/layout/` (app shell, `PageHeader`, `Page`), with the Stoïk tokens of `src/index.css` only. Each page starts with a `PageHeader` (which also sets the document title) and wraps its content in a `Page`.
- Client UX conventions: list filters live in the URL (`useListFilters`), loading states are skeletons shaped like the content, buttons show `loading` while their request runs, successful actions confirm with `useToast`, creating a prospect happens in a `Dialog` and actions that cannot be undone in a `ConfirmedAction` (`src/ui/ConfirmedAction.tsx`), and form errors appear next to their field after blur, with focus moved to the first one on submit.
- Commits follow Conventional Commits.

## Before you call it done

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm test:e2e
```

## Where to look

| Topic                                               | File                                                    |
| --------------------------------------------------- | ------------------------------------------------------- |
| Premium formula                                     | `apps/api/src/pricing/domain/premium.ts`                |
| Pricing rules (bands, factors, loadings)            | `apps/api/src/pricing/domain/pricing-rules.ts`          |
| Validation rule (a draft quote, once priced)        | `apps/api/src/distribution/domain/quote/quote.ts`       |
| Live premium in the UI                              | `apps/client/src/pages/prospect/useLiveQuote.ts`        |
| Client server state (query keys, cache effects)     | `apps/client/src/lib/server-state.ts`                   |
| Priced terms of a quote                             | `apps/api/src/distribution/domain/quote/quote-terms.ts` |
| Pricing rules in force                              | `apps/api/src/pricing/domain/pricing.ts`                |
| Rules every adapter of a port must keep             | `apps/api/src/distribution/tests/contracts/`            |
| Design tokens and components                        | `apps/client/src/index.css`, `apps/client/src/ui/`      |
| Toolbox (notes, diagrams, data model, API explorer) | `apps/client/src/toolbox/`                              |
| API routes for the toolbox                          | `apps/api/src/common/dev/routes.controller.ts`          |
| Seed                                                | `apps/api/prisma/seed.ts`                               |
