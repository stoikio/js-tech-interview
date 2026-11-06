# Stoïk Lite

A small cyber insurance platform for brokers. A broker creates a prospect from a name and a turnover, configures its quote, and validates it: validating signs the quote and creates a contract. Everything here is fictional.

## Getting started

Requirements: Node.js 22.18+ (see `.nvmrc`), pnpm 10, Docker.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts Postgres in Docker, applies the migrations, seeds the database if it is empty, then starts the client and the API:

| Service | URL                   |
| ------- | --------------------- |
| Client  | http://localhost:3000 |
| API     | http://localhost:3001 |

Other commands:

| Command          | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `pnpm db:reset`  | Drops the database, migrates and seeds again    |
| `pnpm test`      | API unit tests                                  |
| `pnpm test:e2e`  | API end-to-end tests, on a separate database    |
| `pnpm typecheck` | TypeScript in every package                     |
| `pnpm lint`      | oxlint, including the architecture import rules |
| `pnpm format`    | oxfmt                                           |

## How it works

1. A **prospect** is a company with a draft **quote**. The broker picks a turnover bracket, a coverage limit, a deductible and options. Every change is saved, and the API recomputes the **premium**.
2. **Validating** a draft quote signs it and creates a 12-month **contract**.
3. The company leaves the prospects and appears in the contracts, each with a read-only page.

The terms are defined in [GLOSSARY.md](GLOSSARY.md).

## Architecture

```
apps/api       NestJS API, PostgreSQL through Prisma
apps/client    React UI (Vite, Tailwind, TanStack Query)
```

The API has two bounded contexts, on top of a small shared kernel (`core`, `common`):

- `pricing`: the pricing rules and the premium formula, a pure function (`computePremium`).
- `distribution`: companies, quotes and contracts.

Each context has a `domain/` (entities, rules, ports), `use-cases/` (one folder per action) and `infra/` (adapters). A context only reaches another through its `public-api.ts`, and `pnpm lint` checks it. Conventions are in [apps/api/AGENTS.md](apps/api/AGENTS.md).

The client has its pages in `src/pages`, its generic components in `src/ui` and its app shell in `src/layout`.

## Toolbox

The round button in the lower right corner opens a toolbox that may be useful during the interview. It is optional: feel free to use your own tools instead.

| Tool         | Shortcut | What it does                                                     |
| ------------ | -------- | ---------------------------------------------------------------- |
| Notes        | `⌥N`     | Rich text notes, exported as Markdown                            |
| Diagram      | `⌥D`     | An Excalidraw whiteboard                                         |
| Data model   | `⌥M`     | The tables and relations of `apps/api/prisma/schema.prisma`      |
| API explorer | `⌥A`     | Every API route, with a form to call it                          |
| Reset        | `⌥R`     | Clears what the toolbox saved in your browser (development only) |
