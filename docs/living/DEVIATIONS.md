# Deviations

Mismatches between the codebase and what a clean spec would prescribe,
found while reverse-engineering `docs/` from this prototype on
2026-09-06. Logged here rather than silently smoothed over, per project
instructions. None of these have been fixed — this file is a punch
list, not a changelog of fixes.

## Architecture / structural duplication

- **`server/` at repo root duplicates `apps/backend/src/`** file-for-
  file (routes, db, migrations). Looks like leftover pre-monorepo code.
  Should not be copied into new projects; ideally deleted from this one
  once confirmed unused.
- **Root `src/components/PersonnelAuditKPIs.jsx`** duplicates
  `apps/frontend/src/components/PersonnelAuditKPIs.jsx`.
- **`public/js/*.js` + `public/index.html`** is a pre-React vanilla JS
  version of the frontend, still present alongside the React app in
  `apps/frontend`. Root-level `index.html`, `tailwind.config.js`,
  `postcss.config.js`, `dist/` also appear to belong to that earlier
  build.
- **Backend routes registered under 4-5 path aliases each** (e.g. a
  single handler mounted at `/`, `/records`,
  `/personnel-audit/records`, `/api/personnel-audit/records`, and
  `/insighted-dpa/api/personnel-audit/records`) to support both a
  root-path deploy and a `/insighted-dpa/` subpath deploy. Works, but
  is repetitive and error-prone; a single configurable base path would
  be cleaner in a template.
- **Frontend router basename** is detected at runtime via
  `window.location.pathname.startsWith('/insighted-dpa')` — a
  hardcoded string check rather than a build-time env var.

## Security

- **JWT secret has a hardcoded fallback**
  (`process.env.JWT_SECRET || "STRIDE_INSIGHTED_SECRET_2026_KEY_PROD"`)
  in `apps/backend/src/routes/auth.js`. If `JWT_SECRET` isn't set in an
  environment, tokens are signed with a secret that's sitting in
  source control. Must always set `JWT_SECRET` in every real
  deployment; consider making the server refuse to boot without it.
- **New collaborators are always created with the password/passcode
  literal `"123456"`** (`apps/backend/src/routes/collaborators.js`),
  and re-inviting an existing email resets their credentials back to
  that same default. There's no forced password change on first login.
- **Passcode is stored in plaintext** (`users.passcode` column,
  compared with `===`, never hashed) alongside the properly bcrypt-
  hashed `password_hash`. Login accepts either credential.
- **"Request passcode" endpoint returns the passcode directly in the
  API response** instead of sending it via email — there's no email
  delivery implemented at all. Fine for a prototype/demo, not fine to
  carry into a real deployment without an actual email flow.

## Component library vs. app drift

- `apps/frontend/src/components/Header.jsx` and
  `packages/component-library/.../HeroCard.jsx` implement the same
  visual pattern but have drifted: `Header` hardcodes the DepEd
  eyebrow text and has no refresh button; `HeroCard` is fully prop-
  driven with an optional refresh action. Pick one as canonical when
  reusing this template — the shared-library version is the one worth
  standardizing on.
- Modals (`AddInterventionModal`, `RowEditModal`, etc.) don't use the
  shared `Button` component consistently — some use raw Tailwind
  buttons instead. No shared `Modal` component exists at all in
  `@insighted/ui` despite 7 nearly-identical modal shells existing in
  the app (see `MODAL_PATTERNS.md`) — worth extracting into the
  component library the next time this project is touched.

## Business logic gaps

- Interventions have no completion/status field — no way to mark one
  "done."
- Interventions update/delete endpoints allow `user_id` to be `null` as
  a bypass condition (`WHERE ... AND (user_id = $2 OR $2 IS NULL)`) —
  this looks like a leftover from testing/mock-mode rather than
  intentional access control, since `userId` is always populated from
  `verifyToken` in real requests. Worth confirming intent before
  copying this pattern forward.
- No distinct permission behavior for `role = 'COLLABORATOR'` vs
  `'HRMO'` beyond both being scoped to the same region/division —
  collaborators can do everything an HRMO can within that scope.
- `DonutCard` has no click-through/drill-down support even though
  `HistogramCard` does, despite both showing the same kind of
  categorical breakdown data (reasons for vacancy vs. aging status).

## Toasts / global notifications

No toast/snackbar notification system exists anywhere in the codebase
— all success/error feedback is inline per-form/modal. Not itself a
"deviation" from a spec (no spec claimed this exists), but flagged so a
future project doesn't assume a shared notification pattern is
available to reuse.
