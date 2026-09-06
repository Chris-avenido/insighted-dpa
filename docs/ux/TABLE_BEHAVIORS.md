# Table Behaviors

Canonical component: `DataTable` (`packages/component-library/src/components/DataTable/DataTable.jsx`).

## Column definition contract

```js
{
  key: string,             // property name read from each row
  label: string,           // header text
  sticky?: 1 | 2,          // pins column to left edge (1 = first sticky col, 2 = second)
  align?: 'left'|'center'|'right',
  minWidth?: number,       // px
  render?: (value, row) => ReactNode,  // custom cell renderer; defaults to raw value
  sortable?: boolean,      // defaults to true when onSort is provided
}
```

Rendering is fully delegated to `columns[].render` — the table itself
has zero knowledge of the data's domain. This is the pattern to follow
for any new data grid: keep the shell generic, push formatting logic
to the caller.

## Sorting

- Single-column sort only (`sortKey` + `sortDir: 'asc'|'desc'`), driven
  by the caller (`onSort(key)` callback) — the table has no internal
  sort state, it's fully controlled.
- Header shows `↕` (neutral) when not the active sort column, `↑`/`↓`
  when active.
- Clicking a header only sorts if `col.sortable !== false && onSort` is
  truthy.

## Per-column filtering

- Optional second header row (`filterRow`) rendered only if
  `onColumnFilterChange` is supplied — one text input per column.
  `columnFilters` is a controlled `{ [key]: string }` object owned by
  the caller.
- There is no filter-type variation (no dropdowns/date-range pickers at
  the table level) — every column filter is a plain text input; more
  complex filter types are handled outside the table (e.g. KPI-tile
  clicks setting external filter state, as in `AuditDashboard`).

## Pagination

- Client-side only: `page` (1-based), `pageSize` (default 100),
  `onPageChange(page)`. The table slices `data` itself
  (`data.slice(startIdx, startIdx+pageSize)`) — it assumes `data` is
  already the full filtered dataset, not a server page.
- Pagination controls (`← Prev` / `Next →` + "Page X of Y (N rows)")
  only render when `totalPages > 1 && onPageChange` is provided.

## Sticky columns

Two sticky-column levels are supported (`sticky: 1` and `sticky: 2`)
for pinning the first one or two columns during horizontal scroll —
used in the audit table to keep "Item Number" and "Position Title"
visible while scrolling through many data columns (see
`LAYOUT_STRUCTURE.md` — this is called out explicitly in the app's
page subtitle: *"Item Number and Position Title stay frozen during
horizontal scroll."*).

## Row styling

`getRowClassName(row) => string` lets the caller apply per-row CSS
classes — used in the source app for status-based row coloring (e.g.
highlighting rows that are still unaudited).

## Empty state

`emptyText` prop (default `"No records found."`) renders as a single
full-width cell when `data` (after pagination) is empty.

## Domain-specific table logic NOT in the shared component

`apps/frontend/src/hooks/useTableSortAndFilter.jsx` implements the
actual sort/filter *logic* (extractor functions per column, sort
comparators) for domain-specific record shapes — it's a companion hook
used by page-level tables (`AuditDashboard`, `CategoryItemsModal`) that
feed processed data + handlers into `DataTable`. When reusing this
pattern in a new project, port the hook's *shape* (extractors map →
sort/filter state → processed data) rather than its specific field
names.
