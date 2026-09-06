# Business Logic

Generated from `apps/backend/src/routes/*.js`, `packages/shared/src/schemas/*.js`,
and `apps/backend/src/db/migrations/*.sql`. This is an AI-maintained
snapshot — update it whenever a change touches validation, permissions,
or calculations.

## Authentication & accounts

- **Registration** (`POST /api/auth/register`): email must end with
  `@deped.gov.ph` or `.deped.gov.ph` (Zod refine). Passcode must be
  exactly 6 numeric digits. Role must be one of `HRMO`, `COLLABORATOR`,
  `ADMIN` (defaults `HRMO`). Email uniqueness enforced both at the
  Postgres `UNIQUE` constraint and with an explicit pre-check inside a
  transaction (checked, then rolled back with a 409 if it already
  exists).
- **Login** (`POST /api/auth/login`): accepts either the bcrypt
  password OR the plaintext 6-digit passcode as valid credentials —
  either one succeeds. Inactive accounts (`is_active = false`) are
  rejected with 403 regardless of credential correctness.
- **Passcode login** (`POST /api/auth/login-passcode`): passcode-only
  auth path, same 403-if-inactive rule, 401 on mismatch.
- **Request passcode** (`POST /api/auth/request-passcode`): looks up
  the user by email and returns their existing passcode directly in
  the JSON response (no email is actually sent — see `DEVIATIONS.md`).
- **JWT**: 24-hour expiry, payload carries `id, deped_email, role,
  region_id, division_id, first_name, last_name`. Signing secret falls
  back to a hardcoded default if `JWT_SECRET` env var isn't set (see
  `DEVIATIONS.md` — a real deployment must always set `JWT_SECRET`).
- **Change password** (`POST /api/auth/change-password`, auth
  required): requires matching either the current bcrypt hash or the
  stored plaintext passcode. New password must be ≥6 characters and
  match `confirmPassword` if provided. Only `password_hash` is updated
  — the plaintext `passcode` column is left unchanged, so the original
  passcode keeps working as an alternate credential even after a
  password change.

## Authorization / scoping

- Every HRMO/Collaborator account carries a `region_id` + `division_id`
  in its JWT. Data-fetching endpoints (`/records`, `/kpis`) always
  prefer the **JWT's** region/division over any query-string override —
  a client cannot widen its own scope by passing different query
  params.
- Row updates (`PUT /api/personnel-audit/:id`) explicitly re-check that
  the target record's `region_id`/`division_id` matches the
  authenticated user's scope (substring-tolerant match) before allowing
  the update — returns 403 if it doesn't.
- Collaborators inherit the inviting HRMO's region/division unless the
  invite payload overrides it.
- There is no row-level check preventing a collaborator from acting
  outside intended limits beyond the region/division match — no
  separate "read-only collaborator" mode exists despite the `role`
  column distinguishing `HRMO` vs `COLLABORATOR`. Treat this as a gap,
  not a documented permission tier.

## Personnel audit record calculations

- **`is_audited` (position UNFILLED)**: true once `reason_for_vacancy`
  AND `status_of_vacancy` are both non-empty, AND EITHER
  `tentative_date_to_fill_up` is filled OR the current
  `status_of_vacancy` is one of the "not required" statuses:
  - `NA_TENTATIVE_DATE_STATUSES` (tentative date forced to `null`):
    `"CTI Item - Request for Abolition"`
  - `OPTIONAL_TENTATIVE_DATE_STATUSES` (tentative date optional, no
    blocking): `"Position is not consistent in the ECP"`,
    `"Hard to Fill Position - Guidance Counselor items"`
  - Once `is_audited` was true (or `item_status = 'Audited'`), it stays
    true (`isAlreadyAudited` short-circuits future re-derivation)
    unless the client explicitly overrides it in the payload.
- **`is_audited` (position FILLED)**: true once `name_of_incumbent` AND
  `first_day_of_service` are both filled. Setting status to `FILLED`
  forcibly nulls `reason_for_vacancy`, `status_of_vacancy`,
  `date_of_vacancy`, `tentative_date_to_fill_up` (a filled position has
  no vacancy reason).
- **Name normalization**: `name_of_incumbent` is upper-cased both at
  the DB trigger level (`trg_uppercase_incumbent_name`, migration 001)
  and again in the PUT handler — belt-and-suspenders duplication, not a
  bug, but worth knowing only one needs to exist.
- **`"N/A"` placeholder handling**: any date field receiving the
  literal string `"N/A"` (any case) is stored as SQL `NULL`, not the
  string `"N/A"`.
- **DB constraint** `chk_incumbent_filled_state`: enforces at the
  Postgres level that `FILLED` rows always have both
  `name_of_incumbent` and `first_day_of_service`, and `UNFILLED` rows
  have neither — a hard invariant, not just app-level validation.
- **Vacancy aging / KPI aggregates**: `GET /api/personnel-audit/kpis`
  computes `completionPercentage = round(audited/total * 100, 1)` per
  scoped region/division, plus a group-by count of
  `vacancy_aging_status` and `reason_for_vacancy` — both computed
  server-side in SQL, not client-side.

## Interventions

- `target_date` must be a valid date strictly **after** today (Zod
  refine, end-of-today comparison) — cannot log an intervention with a
  past or today target date.
- `expected_outcomes` and `remarks` accept array, object, or plain
  string input and are normalized server-side into a JSON array before
  storage (`remarks` as free string becomes
  `[{text, by: userName, at: isoTimestamp}]`).
- **Idempotency guard**: before inserting, checks for an identical
  intervention (`same user + area_of_concern + intervention_to_undertake
  + responsible_office + target_date`) created in the last 10 seconds,
  and returns the existing row instead of duplicating — guards against
  double-submit from a slow network/double click slipping past
  client-side guards.
- Update/delete require `user_id` match (or `null` bypass — see
  `DEVIATIONS.md`, this null-bypass looks unintentional) — i.e.
  interventions are private per-user by default, not shared across
  collaborators in the same division.
- No status/completion tracking exists on an intervention beyond its
  fields — no "done"/"in progress" state.

## Collaborators

- Inviting a collaborator (`POST /api/collaborators/invite`) always
  sets their password to the literal default `"123456"` (bcrypt
  hashed) and passcode to `"123456"` — every new collaborator starts
  with the same known credential. Flagged as a real security
  consideration in `DEVIATIONS.md`, not just a code-quality nitpick.
- Re-inviting the same email (`ON CONFLICT (deped_email) DO UPDATE`)
  resets their credentials back to the default `123456` again.
- Deleting a collaborator removes both the `collaborators` row and the
  matching `users` row (only if `role = 'COLLABORATOR'`, so it can't
  accidentally delete an HRMO account sharing that email).
