# Component Library

Package: `@insighted/ui` (`packages/component-library`). All components
are prop-driven and decoupled from routing/context — they take data and
callbacks as props rather than reading app-specific context, so they
port cleanly into a new project. Import via:

```js
import { Sidebar, HeroCard, KpiCard, KpiCardGrid, StatCard,
         CompletionStatCard, HistogramCard, DonutCard, DataTable,
         Button, UserGuide } from '@insighted/ui';
import '@insighted/ui/tokens.css'; // once, at app root
```

Each component has a co-located `.module.css` (CSS Modules — scoped
class names, referencing the `--iu-*` tokens) and a `.stories.jsx`
(Storybook) file. Follow this pattern for new components.

## Button
`components/Button/Button.jsx`
Variants: `primary` (default CTA), `secondary` (glass, sidebar/toolbar),
`teal` (submit/add forms), `save-active` / `save-disabled` (green/grey
save-state toggle), `undo` (amber), `danger` (destructive/red).
Props: `variant`, `icon`, `children`, `loading`, `loadingText`,
`disabled`. Loading state swaps content for a spinner span.

## Sidebar
`components/Sidebar/Sidebar.jsx`
Collapsible icon-rail navigation (icon-only, expands on hover/pin).
Decoupled from `react-router-dom` — navigation items, active state,
theme toggle, and sign-out are all passed as props/callbacks, not
pulled from a router or auth context. Props: `logoSrc`, `appTitle`,
`appSubtitle`, `user {fullName, position, location}`, `navItems
[{to, icon, label, isActive}]`, `theme`, `onThemeToggle`, `onSignOut`,
`footerNote`, `renderNavItem` (optional custom item renderer).

## HeroCard
`components/HeroCard/HeroCard.jsx`
Top page banner: two-part eyebrow label, large title, subtitle, and an
optional "Refresh Data" button. Maps to the `Header`/`.topbar` pattern
in the app (see `HEADER_FOOTER_PATTERNS.md`).

## KpiCard / KpiCardGrid
`components/KpiCard/KpiCard.jsx`
Clickable KPI tile: label, large count, optional progress bar with a
completion sticker. `isActive` highlights the tile as the current
filter. `KpiCardGrid` renders an array of card prop-objects in the
correct grid layout.

## StatCard / CompletionStatCard
`components/StatCard/StatCard.jsx`
Simple glass summary card: label + large value + optional children
slot. `CompletionStatCard` is a pre-composed variant with an inline
progress bar for a 0–100 percent value.

## DonutCard
`components/DonutCard/DonutCard.jsx`
Chart.js Doughnut wrapper with title and right-side legend. Data shape:
`[{label, value, color?}]`. Falls back to the shared `chartPalette` if
`color` is omitted. See `CHART_PATTERNS.md`.

## HistogramCard
`components/HistogramCard/HistogramCard.jsx`
Chart.js Bar wrapper with a custom `valueLabelsPlugin` that draws the
numeric value above each bar, an optional hint line, and `onBarClick`
for drill-down interactions. Data shape: `[{label, value, color?,
borderColor?}]`. See `CHART_PATTERNS.md`.

## DataTable
`components/DataTable/DataTable.jsx`
Generic sortable/filterable/paginated table shell — column definitions
control rendering (`columns[].render`), keeping the component
domain-agnostic. See `TABLE_BEHAVIORS.md` for the full contract.

## UserGuide
`components/UserGuide/UserGuide.jsx`
Accordion-based in-app help/documentation page: banner with a font-size
magnifier (100/120/140%, persisted to `localStorage`), expand-all/
collapse-all controls, and numbered accordion sections
(`{key, title, subtitle?, icon?, content}`).

## App-specific components (NOT in the shared library)

These live in `apps/frontend/src/components/` and are specific to this
project's domain (personnel audit records) — do not copy them verbatim
into a new project, but their *structural pattern* (see
`MODAL_PATTERNS.md`) is reusable:

- `AddInterventionModal`, `CategoryItemsModal`, `RemarksModal`,
  `RowEditModal`, `SaveFinalizedEditsModal`, `UndoChangesModal`,
  `UnfinalizeConfirmModal` — all modals, domain-specific.
- `FlatpickrInput` — thin wrapper around the `flatpickr` date picker
  library; reusable as-is.
- `Header` — app-specific single-purpose version of `HeroCard` (see
  `DEVIATIONS.md` — these have drifted from each other).
- `PersonnelAuditKPIs` — domain-specific KPI row composition (uses
  `KpiCard`/`StatCard` internally, not reusable itself).
