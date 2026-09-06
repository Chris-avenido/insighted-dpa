# Settings Patterns

Reference: `apps/frontend/src/pages/Settings.jsx`.

## Section layout

The Settings page is a single scrolling page divided into stacked
glass-card sections, not tabs. Each section follows the same header
pattern:

```jsx
<div className="section-title mb-4">
  <SomeIcon />
  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Section Name</h3>
</div>
{/* section content/form fields below */}
```

Sections present in this project (in order):
1. **HRMO Profile** — read-only(ish) display of the account's
   region/division/position/name.
2. **Change Password** — current-passcode verification (live check
   against the server as the user types, per the "Verifying current
   passcode against database..." / "✓ Passcode verified against
   database" status text) before allowing a new password to be set.
3. **Collaborators & Scope** — list of collaborators tied to this
   HRMO's region/division, with an invite form.

## Live verification pattern

The Change Password section calls
`POST /api/auth/verify-passcode` as the user types their current
passcode (debounced client-side, exact debounce not verified in this
pass) and shows an inline status message rather than waiting for full
form submission to report a wrong passcode. This "verify before commit"
pattern is worth reusing anywhere a form needs to confirm a sensitive
precondition before the real submit action.

## What's NOT here

No notification/preferences toggles, no theme setting inside Settings
(theme lives in the sidebar, not Settings — see
`INTERACTION_PATTERNS.md`), no account deletion/deactivation UI for the
HRMO themselves. If a future project needs a fuller settings page,
these are gaps to fill rather than existing patterns to copy.
