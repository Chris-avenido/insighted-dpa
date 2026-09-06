# Sync Specs Workflow

This workflow provides a standardized audit procedure to verify that implementation code, frozen specs, and living documentation remain aligned across sessions.

## 1. Audit Target Identification

Identify the component, route, or feature to be audited. Determine which spec files apply:
- **Product Scope & Architecture:** `docs/product/PRODUCT_OVERVIEW.md`, `docs/product/ARCHITECTURE.md`
- **UI/UX Visual & Interaction Contract:** `docs/ux/` (`DESIGN_CONTRACT.md`, `UI_DESIGN_SYSTEM.md`, `COMPONENT_LIBRARY.md`, etc.)
- **Living Business Logic & Data Flow:** `docs/living/BUSINESS_LOGIC.md`, `docs/living/DATA_FLOW_MAP.md`

## 2. Compare Code vs. Specs

1. **Frozen Specs (`docs/product/`, `docs/ux/`):**
   - Check if implementation logic or visual presentation strictly adheres to frozen spec tokens, components, and layout bounds.
   - **Rule:** If code and frozen spec disagree, **the spec wins**. Do NOT edit the frozen spec file directly without explicit user instruction.
   - If code intentionally or out of necessity deviates, log the discrepancy in `docs/living/DEVIATIONS.md`.

2. **Living Docs (`docs/living/`):**
   - Check if `BUSINESS_LOGIC.md`, `DATA_FLOW_MAP.md`, `DECISIONS.md`, `CHANGELOG.md`, `PROGRESS.md`, or `DEVIATIONS.md` reflect current code reality.
   - Update living docs proactively during the session to match implementation changes.

## 3. Reporting Mismatches & Seeking User Approval

When a mismatch is identified:
1. Record the exact deviation in `docs/living/DEVIATIONS.md` with:
   - What was expected by the spec
   - What is implemented in code
   - Rationale / root cause
2. Present the deviation to the user.
3. Only update a frozen spec file (`docs/product/` or `docs/ux/`) if the user explicitly approves updating the specification to match code.

## 4. Handoff & Session Logging

At the end of an auditing or editing session:
- Update `docs/living/CHANGELOG.md` with summary of changes made.
- Update `docs/living/PROGRESS.md` with current state and pick-up notes for the next session.
