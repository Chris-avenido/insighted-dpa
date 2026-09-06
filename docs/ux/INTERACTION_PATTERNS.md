# Interaction Patterns

## Staged-edit workflow (the core interaction pattern of this app)

Row edits are never written to the server immediately. The flow, as
implemented across `RowEditModal`, `SaveFinalizedEditsModal`, and
`UndoChangesModal`:

1. User opens a row's edit modal (`RowEditModal`), changes fields —
   these go into a local `stagedEdits` map (`{ [recordId]: { field: value } }`)
   held in page/context state (`AppContext`), **not** sent to the API.
2. Staged edits are visually indicated as pending (e.g. a "Save
   Changes" button becomes active — see `Button`'s `save-active` vs
   `save-disabled` variants, which exist specifically to reflect
   "are there any pending edits right now").
3. Before committing, `SaveFinalizedEditsModal` shows a diff review
   (old value → new value per changed field) so the user confirms
   intent before the PUT request fires.
4. `UndoChangesModal` lets the user discard staged edits — either all
   of them or one specific record's — before they're ever sent.
5. Only on explicit save does the frontend call
   `PUT /api/personnel-audit/:id` with the merged payload.

When building a new feature with "edit then confirm" semantics, follow
this staged-edit → review-diff → commit shape rather than saving on
every field change.

## Confirm-before-destructive-action

Any action that discards data or reverts state shows a dedicated
confirm modal first (see `MODAL_PATTERNS.md` →
`UnfinalizeConfirmModal`). No native `window.confirm()` is used
anywhere in the audited code — always a styled modal instead.

## Click-to-drill-down

KPI tiles (`KpiCard`, `isActive`) and histogram bars (`HistogramCard`,
`onBarClick`) both use "click to filter/reveal detail" — clicking sets
an active filter or opens `CategoryItemsModal` scoped to that category.
This is the standard way this app surfaces detail-on-demand instead of
always showing everything at once.

## Loading / busy states

- Buttons: `loading` prop on the shared `Button` swaps its content for
  a spinner and disables the button; optional `loadingText` overrides
  the label text while loading (e.g. "Saving…").
- Full-page loading: a centered spinner + text, not a skeleton loader
  (see `App.jsx`'s auth-loading state) — this is the pattern to reuse
  for any other full-page async gate.
- No toast/snackbar system exists in the codebase — errors are shown
  inline (e.g. `setError('...')` state rendered as a message in the
  form/modal itself), not as global notifications. Logged as a gap in
  `DEVIATIONS.md` since a shared toast pattern doesn't exist to
  document.

## Dark mode toggle

A single button (`Sidebar`'s theme button) toggles a `dark` class on
`<body>`, persisted however the app's theme context does so (check
`AppContext.jsx` if reusing — not independently re-verified for this
doc pass beyond the CSS contract in `UI_DESIGN_SYSTEM.md`).
