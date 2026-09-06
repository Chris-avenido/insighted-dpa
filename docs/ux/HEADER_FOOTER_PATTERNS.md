# Header & Footer Patterns

## Header

Two parallel implementations exist — treat the shared-library one as
canonical for new projects, but note the drift (`DEVIATIONS.md`):

- **App-specific**: `apps/frontend/src/components/Header.jsx` — fixed
  content (`eyebrow-primary`/`eyebrow-secondary` hardcoded to
  "Department of Education" / "HROD & Infrastructure"), only `title`
  and `subtitle` are props.
- **Shared library**: `packages/component-library/.../HeroCard.jsx` —
  same visual structure, but every text field is a prop
  (`eyebrowPrimary`, `eyebrowSecondary`, `title`, `subtitle`), plus an
  optional `onRefresh` / `isRefreshing` action button the app-specific
  `Header` doesn't have.

Structure (both):
```
<header class="portal-header">
  <div class="topbar">
    <div class="eyebrow">
      <span class="eyebrow-primary">...</span>
      <span class="eyebrow-divider">|</span>
      <span class="eyebrow-secondary">...</span>
    </div>
    <div class="title-row">   <!-- HeroCard only -->
      <h2>{title}</h2>
      <button class="refresh-btn">⟳ Refresh Data</button>  <!-- optional -->
    </div>
    <p>{subtitle}</p>
  </div>
</header>
```

Content is route-driven — see `HeaderTitleMapper` in
`NAVIGATION_FLOW.md` — each page swaps in its own title/subtitle rather
than the header reading page-local state.

## Footer

A single static line rendered once, outside the routed content, at the
very bottom of `App.jsx`:

```
<footer>Department of Education Personnel Audit System • Official BHROD Portal</footer>
```

No footer navigation, links, or per-page variation — it's a fixed
attribution/branding line. When reusing this template, this is the one
line to swap for the new project's own name/tagline.
