# Changelog

Seeded from `git log` at doc-generation time (2026-09-06). Keep entries
concise going forward — enough to restore context quickly, not a full
narrative.

- **add export csv** — CSV export capability added.
- **retirement option added** — new reason-for-vacancy / status option
  for retirement-driven vacancies.
- **COMPONENT LIBRARY FIX** — fixes to `@insighted/ui`.
- **login token** — JWT login flow work.
- **header** — header component changes.
- **go / sdo fix / final / deployment / new changes** — deployment and
  fix iterations (messages too generic to reconstruct specifics from
  git log alone).
- **feat: Add normalized 2personnel_audits dataset with id, dpa_month,
  and dpa_year** — dataset normalization for the CSV import.
- **Fix dark mode table styling and schema CSV import updates**
- **Initial commit: Relational auth schema migration, seed data, and
  JWT authentication service**

## 2026-09-15 — Filled & Unfilled Position Breakdown Cards (HQ-Style Carousel)
- Implemented `PositionBreakdownCards` component with dynamic Teaching, Non-Teaching, and Teaching-Related graph breakdowns.
- Added scrollable multi-slide carousel (`‹ • • • • ›`) supporting Category, Status, Salary Grade, and Aging dimensions.
- Integrated emerald/rose accent cards and live accomplishment summary on `HomeDashboard.jsx`.

## 2026-09-15 — System Preservation & Non-Regression Policy Established
- Created single authoritative `SYSTEM_PRESERVATION_POLICY.md` documenting verified repository inventory, 18 core non-regression principles, and protected domain invariants.
- Added root integration files `AGENTS.md` and `GEMINI.md` referencing the authoritative policy without duplicating or conflicting.
- Added synchronized rule integration layers `.agent/rules/system-preservation-policy.md`.
- Created active Antigravity skill `.agent/skills/dpa-system-guardian/SKILL.md` with pre-modification impact checklist and invariant reference tables.

## 2026-09-06 — Restructured docs folder & added self-protection rules
- Removed obsolete `docs/SCOPE.md`.
- Updated relative paths in `docs/ux/DESIGN_CONTRACT.md`.
- Created `.agent/workflows/sync-specs.md` global audit workflow file.
- Added "Self-protection: this file is frozen too" section to `CLAUDE.md` and `.agent/rules/antigravity-brain.md`.

## 2026-09-06 — Initial docs/ generation
Reverse-engineered the full `docs/` folder (this file included) from
the existing codebase, per the user's request to use this prototype as
the template for other apps. See `DEVIATIONS.md` for what was found
messy/inconsistent along the way.
