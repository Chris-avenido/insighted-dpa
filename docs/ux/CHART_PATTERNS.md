# Chart Patterns

Library: **Chart.js 4** via **react-chartjs-2**. Two chart types are
used in this project; both live as reusable components in
`@insighted/ui` (see `COMPONENT_LIBRARY.md`).

## Common conventions

- `responsive: true, maintainAspectRatio: false` — chart fills a fixed-
  height wrapper div (`height` prop, default `260px`) rather than
  driving its own aspect ratio.
- Font in all chart text: `font.family` from tokens
  (`"Plus Jakarta Sans", "DM Sans", ...`).
- Dark mode is NOT automatic — each chart component takes an `isDark`
  boolean prop and manually branches text/grid colors. There is no
  Chart.js global dark-mode plugin; the caller must know and pass the
  current theme.
- Card chrome: every chart card wraps the canvas in a glass card with
  a `.sheen` overlay div and a `.header` block (`title` + optional
  `hint`) above the chart — consistent with the "glass card" pattern in
  `UI_DESIGN_SYSTEM.md`.

## Donut / Doughnut (`DonutCard`)

- Registers `ArcElement, Tooltip, Legend`.
- Legend position: `right`, `boxWidth: 12`, font size 11, weight 600.
- Legend text color: `#e2e8f0` in dark mode, `#334155` in light mode
  (hardcoded, not a CSS variable, since Chart.js renders to canvas).
- Segment colors: caller-supplied `color` per data point, else falls
  back to `chartPalette` cycling by index (see `UI_DESIGN_SYSTEM.md`).
- No built-in click-through behavior on donut segments in this
  component (unlike the bar chart) — if drill-down-on-segment-click is
  needed, it isn't wired up yet; flagged in `DEVIATIONS.md`.

## Bar (`HistogramCard`)

- Registers `CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend`.
- Legend is **hidden** (`legend: { display: false }`) — the chart title
  and hint line do that job instead.
- Bars: `borderWidth: 1`, `borderRadius: 6`.
- Y axis: `beginAtZero: true`, `grace: '20%'` (adds 20% headroom above
  the tallest bar so value labels don't get clipped), `precision: 0`.
- X axis grid hidden (`grid: { display: false }`); Y axis grid shown
  with a light color (`rgba(226,232,240,0.5)` light /
  `rgba(255,255,255,0.1)` dark).
- **Custom plugin `valueLabelsPlugin`**: draws the numeric value above
  each bar in bold 12px chart font, switching fill color to white when
  a bar is tall enough that the default label position would be
  clipped at the top of the canvas (`y < 16`). This is the one piece
  of genuinely reusable custom Chart.js plugin code in the project —
  copy it verbatim into any new bar chart that needs on-bar value
  labels.
- Click-through: `onClick` reads the clicked bar's `label` and invokes
  `onBarClick(label)` — used for drill-down (e.g. clicking a vacancy-
  aging bar opens `CategoryItemsModal` filtered to that category). A
  bar labeled literally `'No Data'` is special-cased to not fire the
  callback.

## When porting to a new project

- Keep the `valueLabelsPlugin` and the `isDark`-prop pattern verbatim —
  they're the two non-obvious pieces of chart logic here.
- The `chartPalette` and `agingColors` constants in `tokens.js` are
  domain-specific (vacancy-status naming) — replace the *status names*
  but keep the same red/green/blue/orange semantic assignment.
