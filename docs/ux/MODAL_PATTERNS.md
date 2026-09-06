# Modal Patterns

There is no shared `Modal` component in `@insighted/ui` — every modal
in this project is a hand-rolled component in
`apps/frontend/src/components/` (`AddInterventionModal`,
`CategoryItemsModal`, `RemarksModal`, `RowEditModal`,
`SaveFinalizedEditsModal`, `UndoChangesModal`,
`UnfinalizeConfirmModal`). They all repeat the same markup skeleton
using raw Tailwind classes rather than a shared component. **This is a
gap** — logged in `DEVIATIONS.md` — but the repeated pattern below is
consistent enough to document and copy verbatim into new modals (or,
better, extract into a shared `Modal` component in the component
library the next time this project is worked on).

## Structural contract (as consistently implemented)

Every modal is a plain function component that:

1. Takes `isOpen` and returns `null` immediately if falsy — no portal,
   no animation library, no focus-trap. Conditional rendering only.
2. Takes `onClose` for the dismiss callback.
3. Renders a full-screen overlay:
   ```
   className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
   ```
4. Renders a panel inside the overlay:
   ```
   className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-{md|lg|6xl} overflow-hidden flex flex-col max-h-[85vh]"
   ```
   `max-w-*` varies by content: `max-w-md` for confirm dialogs,
   `max-w-6xl` for data-table modals like `CategoryItemsModal`.
5. Header block: `px-6 py-4 border-b ... bg-slate-50/60 dark:bg-slate-800/40 flex justify-between items-center` —
   icon-in-colored-circle + title/subtitle on the left, close `X`
   button (lucide-react `X` icon) on the right.
6. Body: scrollable region (`overflow-y-auto` where content can exceed
   `max-h`), form fields or data content.
7. Footer (when actions are needed): right-aligned button row, using
   the shared `Button` component variants (`secondary` for Cancel,
   `primary`/`teal`/`danger` for the confirming action) where the modal
   has been updated to use them — some older modals still use raw
   Tailwind buttons instead of the shared `Button` (see
   `DEVIATIONS.md`).

## Confirm-before-destructive-action modals

`UnfinalizeConfirmModal` is the reference pattern for a destructive
confirmation: red icon badge (`AlertTriangle` in a `bg-red-100 dark:bg-red-950/50`
circle), bold warning title, one-line explanation of the consequence,
a `processing` boolean prop that disables the close button and buttons
while the action is in flight.

## Data-review-before-save modal

`SaveFinalizedEditsModal` shows a diff-style review (field label → old
value → arrow → new value, using shared `FIELD_LABELS`/`FIELD_ALIASES`
maps) before committing staged edits — the pattern to follow whenever a
new feature needs a "review your changes before saving" step.

## Bulk-undo modal

`UndoChangesModal` has two tabs (`all` | `single`) for undoing either
every staged edit or one specific record's edits, with a search box to
find a record by item number/title in single mode.
