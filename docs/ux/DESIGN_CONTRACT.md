# Design Contract

This file is the index for every binding UI/UX spec in this project.
Treat all files listed below as **frozen** — do not deviate from them
without explicit user approval (see `CLAUDE.md` → "Frozen standards vs.
AI-maintained docs").

| File | Covers |
|---|---|
| `UI_DESIGN_SYSTEM.md` | Colors, typography, spacing/radius tokens, glassmorphic surface treatment, dark mode |
| `COMPONENT_LIBRARY.md` | Inventory of the shared `@insighted/ui` React component library |
| `CHART_PATTERNS.md` | Chart.js conventions (Doughnut, Bar) — colors, legends, tooltips, value labels |
| `INTERACTION_PATTERNS.md` | Hover/active states, staged-edit workflow, confirm-before-destructive-action |
| `LAYOUT_STRUCTURE.md` | App shell grid, sidebar + main content split, responsive breakpoints |
| `TABLE_BEHAVIORS.md` | Sortable/filterable/paginated data table conventions |
| `MODAL_PATTERNS.md` | Overlay + panel structure for all modal dialogs |
| `SETTINGS_PATTERNS.md` | Settings page section layout |
| `HEADER_FOOTER_PATTERNS.md` | Top header banner and footer conventions |
| `NAVIGATION_FLOW.md` | Sidebar navigation, routing, and page-title mapping |

Non-UI references (not part of the binding visual contract, but load-bearing):

| File | Covers |
|---|---|
| `../product/PRODUCT_OVERVIEW.md` | Purpose, users, objectives |
| `../product/ARCHITECTURE.md` | Tech stack, monorepo/folder structure |
| `../living/BUSINESS_LOGIC.md` | Validation rules, permissions, calculations |
| `../living/DATA_FLOW_MAP.md` | Where data is saved and what triggers each save |
| `../living/DECISIONS.md` | Architecture decision log |
| `../living/DEVIATIONS.md` | Known mismatches between code and frozen specs |
| `../living/CHANGELOG.md` / `../living/PROGRESS.md` | Running history and session handoff notes |

## Provenance note

These specs were generated on 2026-09-06 by reverse-engineering the
`insighted-dpa` prototype (DepEd Personnel Audit system) — the project
the user has designated as the template to copy into other apps. They
describe the **current, working state** of that codebase, not an
idealized target. Anything messy or inconsistent in the source was
documented as-is per project instructions, and logged in
`DEVIATIONS.md` rather than silently cleaned up.

Before copying this `docs/` folder into another repo, the user should
review each frozen file once and treat that review as the point the
file becomes "approved" for the new project.
