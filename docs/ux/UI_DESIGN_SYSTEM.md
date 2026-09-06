# UI Design System

Canonical source: `packages/component-library/src/tokens.css` and
`tokens.js`, extracted verbatim from `apps/frontend/src/index.css`.
When copying this project as a template, these are the values to carry
over — swap the brand colors for the new project's brand, keep the
structure (semantic tokens, dark-mode overrides, glass utility).

## Font

Google Font **Plus Jakarta Sans** (weights 200–800, italic supported),
fallback stack: `"DM Sans", ui-sans-serif, system-ui, -apple-system,
BlinkMacSystemFont, "Segoe UI", sans-serif`.

```css
--iu-font-family: "Plus Jakarta Sans", "DM Sans", ui-sans-serif, system-ui,
  -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

## Color tokens

### Brand colors
| Token | Hex | Usage |
|---|---|---|
| `--iu-blue` | `#0f5fb7` | Primary brand blue |
| `--iu-blue-2` | `#2783de` | Secondary/accent blue |
| `--iu-yellow` | `#f7c948` | Accent |
| `--iu-red` | `#d62828` | Danger / destructive |
| `--iu-green` | `#1f9d55` | Success / positive |
| `--iu-orange` | `#d97706` | Warning |

### Semantic colors (light mode)
| Token | Value |
|---|---|
| `--iu-ink` | `#172033` (primary text) |
| `--iu-muted` | `#667085` (secondary text) |
| `--iu-surface` / `--iu-surface-strong` | `rgba(255,255,255,0.75)` |
| `--iu-border` | `rgba(255,255,255,0.48)` |
| `--iu-line` | `rgba(23,32,51,0.1)` |
| `--iu-shadow` | `0 24px 80px rgba(15,95,183,0.16)` |

### Semantic colors (dark mode — `body.dark` overrides)
| Token | Value |
|---|---|
| `--iu-ink` | `#f8fafc` |
| `--iu-muted` | `rgba(255,255,255,0.68)` |
| `--iu-surface` / `--iu-surface-strong` | `rgba(15,23,42,0.75)` |
| `--iu-border` | `rgba(255,255,255,0.14)` |
| `--iu-line` | `rgba(255,255,255,0.12)` |
| `--iu-shadow` | `0 24px 80px rgba(0,0,0,0.28)` |

Dark mode is toggled by adding/removing a `dark` class on `body`
(`body.dark { ... }`), not via `prefers-color-scheme` or a `data-theme`
attribute. Tailwind's `darkMode: 'class'` config matches this.

### Chart palette (categorical)
```js
chartPalette = ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#64748b']
```
(red-500, orange-500, amber-500, emerald-500, blue-500, violet-500,
pink-500, slate-500 — standard Tailwind 500-shade palette, cycled by
index for donut/histogram chart segments.)

### Status color mapping (vacancy aging)
```js
agingColors = {
  'newly created': { bg: 'rgba(59,130,246,0.85)',  border: '#2563eb' },  // blue
  'long-term':     { bg: 'rgba(239,68,68,0.85)',    border: '#dc2626' },  // red
  'unfilled':      { bg: 'rgba(239,68,68,0.85)',    border: '#dc2626' },  // red
  'extended':      { bg: 'rgba(249,115,22,0.85)',   border: '#ea580c' },  // orange
  'new':           { bg: 'rgba(16,185,129,0.85)',   border: '#059669' },  // green
  'aging':         { bg: 'rgba(139,92,246,0.85)',   border: '#7c3aed' },  // violet
  default:         { bg: 'rgba(100,116,139,0.85)',  border: '#475569' },  // slate
}
```
This is a domain-specific mapping (vacancy status → color); when
reusing this project as a template for something with a different
status taxonomy, replace the *keys* but keep the same red=bad,
green=good, blue=neutral/new color logic.

## Shape

- `--iu-radius: 22px` — the standard large-card radius.
- Component-level radii (`radius.card = 16px`, `radius.button = 14px`,
  `radius.pill = 999px`) are slightly smaller than the page-level 22px
  and used inside `tokens.js` for JS-driven styling (e.g. canvas-based
  chart borders).

## Glassmorphism ("glass" surface)

The signature visual treatment used on every card/sidebar/header:

```css
.iu-glass {
  background: rgba(248, 250, 252, 0.35);
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 8px 20px -4px rgba(15, 23, 42, 0.02);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
body.dark .iu-glass {
  background: rgba(15, 23, 42, 0.35);
  border-color: rgba(226, 232, 240, 0.18);
}
```

Paired with a "specular sheen" overlay — a subtle top-to-bottom white
gradient placed as the first child of any glass card, giving a soft
glass-reflection highlight:

```css
.iu-specular-sheen {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
  pointer-events: none; opacity: 0.5; transition: opacity 0.3s ease;
}
```
Every card component in `COMPONENT_LIBRARY.md` (KpiCard, StatCard,
DonutCard, HistogramCard, UserGuide banner) renders this sheen as its
first DOM child.

## Page background

Light mode: a layered set of radial gradients (soft blue/yellow/red
tints) over a diagonal blue linear gradient, fixed attachment. Dark
mode swaps to darker radials over a near-black diagonal gradient. See
`apps/frontend/src/index.css` `body` / `body.dark` rules if this exact
background needs to be ported — it's intentionally atmospheric/branded
rather than a generic token, so treat it as optional decoration when
reusing this system for an unrelated brand.

## Scrollbar utility

`.iu-no-scrollbar` hides scrollbars cross-browser (`::-webkit-scrollbar
{ display: none }` + `scrollbar-width: none`) — used on internal
scrolling regions like modal bodies and sidebars.
