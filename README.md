# AssetFlow

AssetFlow is a TypeScript monorepo for an asset management platform. The repository currently contains:

- a Next.js web app
- a NestJS API
- a shared Prisma/PostgreSQL database package

The project is in foundation stage. The database schema and API wiring are in place, but the product-facing application flows are still mostly unbuilt. The goal of this README is to make the current state explicit so the next developer can get productive quickly.

## Current Status

- `apps/web` builds successfully, but is still the default starter UI and does not call the API yet.
- `apps/api` starts successfully and exposes a basic root route plus a database-backed health check.
- `packages/db` contains the Prisma schema, migration history, and generated client used by the API.
- `apps/worker` exists as a placeholder directory only. There is no worker implementation yet.

As of March 19, 2026, the following commands were validated successfully in this repo:

- `pnpm --filter web build`
- `pnpm --filter api build`
- `pnpm --filter api test`
- `pnpm --filter api test:e2e`
- `pnpm --filter @assetflow/db exec prisma validate`

## Tech Stack

- Workspace tooling: `pnpm` workspaces
- Language: TypeScript
- Frontend: Next.js 16, React 19, Tailwind CSS 4
- Backend: NestJS 11
- Database: PostgreSQL
- ORM: Prisma 7
- Prisma runtime adapter: `@prisma/adapter-pg`
- Testing: Jest and Supertest

## Repository Layout

```text
assetflow/
├─ apps/
│  ├─ api/                 NestJS API
│  ├─ web/                 Next.js frontend
│  └─ worker/              Placeholder only
├─ packages/
│  └─ db/                  Prisma schema, migrations, generated client
├─ .vscode/
│  └─ settings.json        VS Code SQL language association for Prisma migrations
├─ package.json            Root workspace scripts
├─ pnpm-workspace.yaml     Workspace package definitions
└─ README.md
```

## Architecture Overview

### Web app

- Location: `apps/web`
- Current state: starter Next.js app with a single static landing page
- API integration: none yet
- Build output: verified successfully

### API

- Location: `apps/api`
- Entry point: `apps/api/src/main.ts`
- Modules currently wired:
  - `AppModule`
  - `PrismaModule`
  - `HealthModule`
- Current routes:
  - `GET /` returns `"Hello World!"`
  - `GET /health` runs `SELECT 1` through Prisma and returns `{ ok: true }`

### Database package

- Location: `packages/db`
- Exported package name: `@assetflow/db`
- Responsibility:
  - owns the Prisma schema
  - owns Prisma migrations
  - exports the generated Prisma client used by the API

Important:

- Import the shared DB package as `@assetflow/db`
- Do not use `assetflow/db`
- Do not edit files under `packages/db/generated/client` manually

## Domain Model

The current schema establishes the first-pass relational model for organizations and assets.

### `User`

- Core identity record
- Unique fields:
  - `email`
  - `clerk_user_id`

### `Organization`

- Tenant/account boundary
- Unique `slug`

### `OrganizationMembership`

- Joins users to organizations
- Tracks role:
  - `owner`
  - `admin`
  - `technician`
  - `viewer`
- Supports `invited_by_user_id`

### `Asset`

- Belongs to an organization
- Unique per organization by `(organization_id, asset_tag)`
- Tracks:
  - status
  - condition
  - purchase metadata
  - warranty and replacement dates
  - QR code value
  - archive timestamp

Current asset enums:

- `AssetStatus`: `in_stock`, `assigned`, `repair`, `retired`, `disposed`
- `AssetCondition`: `new`, `good`, `fair`, `poor`

Note:

- The schema includes `clerk_user_id`, which strongly suggests planned Clerk-based identity mapping.
- There is no Clerk integration in the application code yet.

## Getting Started

### Prerequisites

- Node.js 22.x is recommended
- `pnpm` 10.x
- A reachable PostgreSQL database

### Install dependencies

```bash
pnpm install
```

### Configure environment variables

The API and Prisma setup currently use `DATABASE_URL`.

Recommended location:

- `packages/db/.env`

Example:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Current environment loading behavior:

- Prisma CLI loads `packages/db/prisma.config.ts`
- The API calls `apps/api/src/config/load-environment.ts`
- The API environment loader checks these locations in order:
  - `apps/api/.env` or current working directory `.env`
  - `packages/db/.env`
  - repo-relative fallback to `packages/db/.env`

If you want one source of truth today, use `packages/db/.env`.

### Initialize the database

Generate the Prisma client:

```bash
pnpm --filter @assetflow/db db:generate
```

Apply migrations:

```bash
pnpm --filter @assetflow/db db:migrate
```

If you only want to push the schema without creating a migration:

```bash
pnpm --filter @assetflow/db db:push
```

Open Prisma Studio:

```bash
pnpm --filter @assetflow/db db:studio
```

### Run the applications

Start the API:

```bash
pnpm --filter api start:dev
```

Start the web app:

```bash
pnpm --filter web dev
```

Recommended local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

Port behavior:

- The web app defaults to port `3000`
- The API now defaults to port `3001`
- You can still override the API port with `PORT`

## Root Scripts

The root workspace currently exposes these scripts:

- `pnpm dev:web` runs `apps/web`
- `pnpm dev:api` runs `apps/api`
- `pnpm build` runs `build` scripts across workspace packages that define one

## Package-Specific Commands

### API

```bash
pnpm --filter api build
pnpm --filter api test
pnpm --filter api test:e2e
```

### Web

```bash
pnpm --filter web dev
pnpm --filter web build
```

### Database

```bash
pnpm --filter @assetflow/db db:generate
pnpm --filter @assetflow/db db:migrate
pnpm --filter @assetflow/db db:push
pnpm --filter @assetflow/db db:studio
pnpm --filter @assetflow/db exec prisma validate
```

## API Notes

### Prisma setup

This repo uses Prisma 7 with the PostgreSQL adapter model, not the older implicit datasource runtime behavior.

Current implementation details:

- `@assetflow/db` exports the generated Prisma client
- `apps/api/src/prisma/prisma.service.ts` constructs Prisma with `PrismaPg`
- the API requires `DATABASE_URL` at startup
- the API will fail fast if `DATABASE_URL` is missing
- the API also requires the database to be reachable on boot because `PrismaService` connects during module initialization

### Current test coverage

The API test suite is still minimal:

- unit test covers the default root controller response
- e2e test covers `GET /`
- there is no dedicated automated coverage yet for:
  - `/health`
  - Prisma integration behavior
  - domain-specific business logic

## Frontend Notes

The frontend is intentionally early-stage right now.

What exists:

- App Router setup
- global layout
- starter landing page
- Tailwind CSS 4 configuration

What does not exist yet:

- authentication flow
- data fetching from the API
- asset management UI
- organization management UI

## VS Code / Editor Notes

The workspace includes:

- `.vscode/settings.json`

That setting associates Prisma migration SQL files with the PostgreSQL language mode to avoid false-positive T-SQL diagnostics from SQL Server tooling.

## Known Gaps

The next developer should assume these are still open:

- the web app is not connected to the API
- auth is not implemented, despite the schema preparing for external identity mapping
- the worker app is only a placeholder
- there are no seed scripts yet
- the API routes are still scaffold-level
- test coverage is not representative of production behavior yet

## Suggested First Tasks

If you are picking this project up next, the highest-leverage areas are likely:

1. Establish a stable local developer experience around env files and ports.
2. Add seed data and a repeatable local database bootstrap path.
3. Expand the API beyond health checks into organization, membership, and asset endpoints.
4. Replace the starter web page with a real app shell and API integration.
5. Add integration tests around Prisma-backed API routes.

## Troubleshooting

### `Cannot find module 'assetflow/db'`

Use the scoped package name:

```bash
@assetflow/db
```

Not:

```bash
assetflow/db
```

### API fails on startup with Prisma errors

Check:

- `DATABASE_URL` is set
- the database is reachable
- migrations have been applied

### PowerShell blocks `pnpm`

If a machine has restrictive PowerShell execution policies, `pnpm.cmd` can be used instead of `pnpm`.

## Files Worth Reading First

- `package.json`
- `pnpm-workspace.yaml`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/health/health.controller.ts`
- `packages/db/prisma/schema.prisma`
- `packages/db/package.json`
- `apps/web/app/page.tsx`

## Summary

This repository has a working foundation:

- monorepo wiring is in place
- the database schema is defined and validated
- the API starts and can talk to PostgreSQL
- the frontend builds cleanly

It is not yet a feature-complete application. The next phase is turning this foundation into a real product surface area, starting with API capabilities, frontend integration, and stronger operational/test discipline.
