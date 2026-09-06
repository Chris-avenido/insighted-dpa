# Architecture

## Tech stack

- **Frontend**: React 18 + Vite, React Router v7, Tailwind CSS 3
  (utility classes) alongside hand-written CSS custom properties for
  the design-token layer, Chart.js 4 + react-chartjs-2 for charts,
  lucide-react for icons, flatpickr for date pickers.
- **Backend**: Node.js + Express 4, `pg` (node-postgres) for
  PostgreSQL, `bcryptjs` for password hashing, `jsonwebtoken` for auth
  tokens, `zod` for request validation (via a shared package).
- **Database**: PostgreSQL, plain SQL migration files (no ORM, no
  migration-runner tool — migrations are numbered `.sql` files applied
  manually/by script).
- **Component library**: `@insighted/ui`, a standalone package built
  with Storybook 8 for isolated development/preview.
- **Monorepo tooling**: npm workspaces (`apps/*`, `packages/*`), no
  Turborepo/Nx — just npm workspace scripts + `concurrently` to run
  frontend and backend together.

## Intended folder structure

```
apps/
  frontend/     — React app (Vite). Routes, pages, app-specific components, contexts, hooks.
  backend/      — Express API server. Routes, DB access, migrations, middleware.
packages/
  shared/       — Code used by both frontend and backend: Zod validation schemas.
  component-library/ — @insighted/ui: prop-driven, app-agnostic React components + design tokens.
```

- Code specific to the frontend only → `apps/frontend/src/`.
- Code specific to the backend only → `apps/backend/src/`.
- Anything both sides need (validation schemas, shared constants/types)
  → `packages/shared/src/`, imported as `@project/shared`.
- Reusable, domain-agnostic UI components → `packages/component-library/src/`,
  imported as `@insighted/ui`.

## Current-state reality (as of this doc's generation)

The prototype has **not** fully completed its migration into the
monorepo structure above. Duplication exists that a fresh copy of this
project should NOT carry forward:

- `server/` at the repo root duplicates `apps/backend/src/` (routes,
  db, migrations) file-for-file. It's legacy/pre-monorepo code left in
  place. Logged in `DEVIATIONS.md`.
- `src/components/PersonnelAuditKPIs.jsx` at the repo root duplicates
  `apps/frontend/src/components/PersonnelAuditKPIs.jsx`.
- `public/js/*.js` (vanilla JS: `api.js`, `app.js`, `config.js`,
  `events.js`, `state.js`) and `public/index.html` are a pre-React
  version of the frontend, still present alongside the React app.
- Root-level `index.html`, `tailwind.config.js`, `postcss.config.js`,
  and `dist/` appear to be from that same pre-React build.

**When copying this repo as a template**: start from `apps/`,
`packages/`, and `docs/` only. Do not copy `server/`, root `src/`,
`public/js/`, or the root-level build config files — they are dead
weight from an earlier architecture, not the intended structure.

## Backend routing quirk

Routes in `apps/backend/src/routes/*.js` register each handler against
an array of path aliases (e.g. `["/", "/records", "/personnel-audit/records",
"/api/personnel-audit/records", "/insighted-dpa/api/personnel-audit/records"]`)
rather than a single canonical path. This accommodates multiple deploy
prefixes (root deploy vs. `/insighted-dpa/` subpath deploy) but means
every route is defined 4-5 times over. A cleaner template should
mount the router once under a single configurable base path instead.
Logged in `DEVIATIONS.md`.

## Database access pattern

No ORM. Raw parameterized SQL via `pg`, with a thin `db/index.js`
wrapper exporting `query`/`pool`. Migrations are plain numbered `.sql`
files under `db/migrations/`, applied in order, no down-migrations.
