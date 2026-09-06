# Progress

## 2026-09-06

**Just completed:** Restructured `docs/` into `product/`, `ux/`, and `living/` subfolders, removed `SCOPE.md`, created `.agent/workflows/sync-specs.md`, updated `DESIGN_CONTRACT.md` relative paths, and added the "Self-protection: this file is frozen too" section to `CLAUDE.md` and `antigravity-brain.md`.

**Half-finished:** Nothing in-code — this was a documentation-only
pass, no application code was touched.

**Pick up next:**
1. User should review the frozen spec files (`DESIGN_CONTRACT.md`,
   `PRODUCT_OVERVIEW.md`, `ARCHITECTURE.md`, and all UI/UX pattern
   files) and treat that first read as their "approval" of the
   baseline before copying `docs/` into other repos.
2. Several real issues were surfaced during doc generation and logged
   in `DEVIATIONS.md` — worth a decision on whether to fix them in this
   prototype before it becomes the template (especially: hardcoded
   JWT secret fallback, default `123456` collaborator passwords, and
   the duplicated `server/`/root-level legacy code that shouldn't be
   copied forward).
3. `.agent/rules/antigravity-brain.md` was also created this session
   (mirrors `CLAUDE.md` for cross-tool compatibility) — keep both in
   sync if process rules change.
