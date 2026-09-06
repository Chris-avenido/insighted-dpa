# Product Overview

## What this is

**InsightED DPA (DepEd Personnel Audit)** is a web portal for tracking
and auditing personnel plantilla items (positions) across the
Philippine Department of Education (DepEd), specifically the state of
vacancies (unfilled positions), why they're vacant, and how long
they've stayed that way. It also tracks "interventions" — action plans
HR staff propose to accelerate filling vacancies.

## Who uses it

- **HRMO (Human Resource Management Officer)** — the primary user role.
  Each HRMO account is scoped to one region and one division office;
  they only ever see and edit personnel records within that scope.
- **Collaborator** — an account an HRMO invites to help with the same
  region/division scope. Created with a default password
  (`123456`) that the collaborator is expected to change.
- **Admin** — a role that exists in the schema (`user_role_type` enum)
  but has no distinct UI or elevated behavior implemented yet in this
  prototype — treat as reserved for future use.

## Objectives

- Give HRMOs a live, at-a-glance view of how many plantilla items are
  audited vs. remaining, and why positions are vacant.
- Let HRMOs correct/complete audit records inline (position status,
  incumbent, vacancy reason, dates) without needing a spreadsheet.
- Track "vacancy aging" (how long a position has sat unfilled) so aging
  or long-term vacancies are visible and actionable.
- Let HRMOs log interventions (planned actions with target dates and
  expected outcomes) separately from the audit data itself.
- Support a lightweight multi-user model per division (HRMO +
  collaborators) without full-blown org/role management.

## Scope boundaries (as built)

- No email delivery is implemented — the "request passcode" endpoint
  returns the passcode directly in the API response instead of sending
  an email (see `DEVIATIONS.md`).
- No admin UI exists for the `ADMIN` role.
- Data entry is per-record (row-by-row edits via modal), not
  bulk-import driven — though a CSV import script exists as a
  standalone dev tool (`server/db/import_csv.js` / duplicated under
  `apps/backend/src/db/`).

## Success signals (inferred, not independently confirmed)

- Rising `completionPercentage` (audited / total monitored items) per
  region/division over time.
- Reduction in "long-term"/"unfilled" vacancy-aging categories.
- Interventions created with realistic future target dates and later
  followed up on (no explicit "completed" status exists yet on
  interventions — see `DEVIATIONS.md`).
