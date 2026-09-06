# Navigation Flow

## Primary navigation (Sidebar)

The `Sidebar` component (both the app-specific
`apps/frontend/src/components/Sidebar.jsx` and the shared
`@insighted/ui` `Sidebar`) renders a vertical icon-rail nav. Behavior:

- **Collapsed by default** — icon only, `collapsible-text` labels
  hidden.
- **Expands on hover** (CSS `:hover`) or when pinned/expanded via a
  class toggle (`.pinned` / `.expanded`) — no JS-driven width
  animation, pure CSS transition on width + opacity of the text spans.
- Active route highlighted via `aria-current="page"` and an `.active`
  class — driven by comparing the current route to each `navItems[].to`.
- Theme toggle (`Moon`/`Sun` icon, lucide-react) and Sign Out sit below
  the nav list, always visible (not hidden with the collapsible text
  the same way nav labels are — check the actual CSS before assuming
  parity, since the shared library version keeps their *labels*
  collapsible while icons stay visible, matching nav items).
- Footer note (division/region scope reminder) at the very bottom,
  same collapsible-text behavior as nav labels.

## Auth-gated navigation

`App.jsx`'s `MainLayout` checks `useAuth()` for `token`/`loading`:
- `loading` → full-screen spinner ("Loading DepEd Personnel Audit
  Portal...").
- no `token` → renders `<Login />` in place of the whole shell (no
  route-level redirect, the router isn't even mounted with real routes
  in this state).
- authenticated → normal shell + routes.

## Route → page map

See `LAYOUT_STRUCTURE.md` for the full table. Every top-level nav item
maps 1:1 to a route; there is no nested/tabbed routing within a page in
this prototype — tab-like UI (e.g. Settings sections) is implemented as
in-page scroll sections or conditional rendering, not sub-routes.

## Deep links / subpath deploys

`BrowserRouter`'s `basename` is computed at runtime from
`window.location.pathname.startsWith('/insighted-dpa')` — meaning this
app can be deployed either at the domain root or under an
`/insighted-dpa/` path prefix, and detects which one it's running under
by inspecting the current URL rather than a build-time env var. This is
fragile (hardcoded string) — flagged in `DEVIATIONS.md`. When adapting
this template for a new project, replace with a build-time
`VITE_BASE_PATH` env var instead.
