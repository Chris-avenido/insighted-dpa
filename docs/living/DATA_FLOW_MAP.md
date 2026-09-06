# Data Flow Map

Where data actually gets saved, and what user action triggers each
save. AI-maintained — update whenever a feature changes what reads or
writes data.

## Tables

- `regions`, `division_offices` — reference/lookup data, populated by
  migration/seed, not user-editable through the app.
- `users` — auth + profile. Written by: registration form (`Register`
  page, if one exists in this build — not directly observed, but the
  endpoint exists), collaborator invite (creates a `COLLABORATOR` row),
  change-password (updates `password_hash` only).
- `collaborators` — written by the Settings page's "invite collaborator"
  form (`POST /api/collaborators/invite`), deleted by the "remove
  collaborator" action (`DELETE /api/collaborators/:id`).
- `personnel_audits` — the core dataset. Written by:
  - **Bulk import**: `server/db/import_csv.js` (dev/ops script, not
    exposed through the UI) — loads a CSV like
    `2personnel_audits_*.csv` at the repo root.
  - **Row edits**: `RowEditModal` → staged in `AppContext` →
    `SaveFinalizedEditsModal` confirm → `PUT /api/personnel-audit/:id`.
  - **Unfinalize**: `UnfinalizeConfirmModal` confirm → same PUT
    endpoint, reverting `is_audited`/status fields back to an unfilled
    state.
- `other_interventions` — written by the Interventions page:
  - Create: `AddInterventionModal` submit → `POST /api/personnel-audit/interventions`.
  - Edit: same modal in edit mode → `PUT /api/personnel-audit/interventions/:id`.
  - Delete: Interventions page delete action → `DELETE /api/personnel-audit/interventions/:id`.

## Read paths

- `GET /api/personnel-audit/records` — powers `AuditDashboard`'s main
  table. Always scoped server-side to the caller's JWT
  region/division.
- `GET /api/personnel-audit/kpis` — powers `HomeDashboard`'s KPI tiles,
  aging histogram, and reasons-for-vacancy donut.
- `GET /api/personnel-audit/interventions` — powers the Interventions
  page table, scoped to `user_id` (private per user, see
  `BUSINESS_LOGIC.md`).
- `GET /api/collaborators` — powers the Settings page's collaborator
  list.
- `GET /api/auth/me` — powers the Settings page's profile section and
  any auth-context rehydration on page load.
- `GET /api/auth/regions-divisions` — powers the region/division
  dropdowns wherever registration/invite forms are shown (open, no auth
  required).

## Client-side-only state (never persisted server-side)

- Staged row edits (`stagedEdits` in `AppContext`) — exist only in
  memory until explicitly saved; lost on refresh if not saved. Confirm
  this is the intended behavior before assuming a draft-persistence
  feature is missing — it's a deliberate "you must explicitly save"
  model, not a bug.
- Font-scale preference in `UserGuide` (`localStorage`, key
  `iu_guide_font_scale` in the shared component's default) — per-
  browser, not per-account.
- Theme (light/dark) — check `AppContext`/`AuthContext` for exact
  persistence mechanism if this needs to be traced further; not fully
  re-verified in this documentation pass.
