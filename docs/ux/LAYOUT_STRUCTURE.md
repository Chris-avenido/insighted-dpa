# Layout Structure

## App shell

`apps/frontend/src/App.jsx` renders (once authenticated):

```
<div className="app-shell" id="appShell">
  <Sidebar />
  <main>
    <HeaderTitleMapper />   {/* maps current route → title/subtitle */}
    <Routes>...</Routes>
  </main>
</div>
<footer>Department of Education Personnel Audit System • Official BHROD Portal</footer>
```

`.app-shell` is a CSS grid (defined in `index.css`) splitting the
viewport into a fixed-width sidebar column + a fluid main content
column. On narrow viewports it collapses to a single column
(`grid-template-columns: 1fr`) and the sidebar becomes static/full-width
instead of a fixed rail (breakpoint: `@media (max-width: 1024px)` per
`index.css` — treat this as the mobile/tablet breakpoint for this
design system generally).

## Routing

React Router v7, `BrowserRouter` with a conditional `basename`
(`/insighted-dpa` when deployed under that subpath, `/` otherwise —
see `DEVIATIONS.md` re: hardcoded subpath detection). Routes:

| Path | Page | 
|---|---|
| `/` | HomeDashboard |
| `/audit` | AuditDashboard |
| `/interventions` | Interventions |
| `/guide` | UserGuide |
| `/settings` | Settings |
| `*` | redirect to `/` |

Unauthenticated users see `<Login />` in place of the entire shell
(not a route — `MainLayout` short-circuits before rendering `Routes`
when `!token`).

## Header title mapping

A `HeaderTitleMapper` component (in `App.jsx`, not a separate file)
reads `useLocation().pathname` and picks a hardcoded `{title, subtitle}`
pair per route, passed into the shared `Header`. This is the pattern
to follow for any new route: add a branch here rather than letting each
page manage its own header text.

## Sidebar layout

Collapsed by default (icon rail), expands on hover or when `.pinned`/
`.expanded` class is applied — width and content-reveal both driven by
CSS transitions on `.collapsible-text` elements (label text fades/
slides in), not by conditional rendering. See `NAVIGATION_FLOW.md` for
the interaction contract.

## Card grids

KPI rows and stat rows use CSS grid (`.grid` classes generated per
component, e.g. `KpiCard.module.css`'s `.grid`) rather than Tailwind's
grid utilities directly — grid column counts are fixed per breakpoint
inside each component's own module CSS rather than a single shared
grid utility class. If unifying layout across a new project, consider
promoting a shared responsive grid utility into the tokens/component
library instead of repeating per-component grid rules.
