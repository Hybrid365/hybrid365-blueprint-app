# Hyrox Team schema notes (Phase 1)

## What was created

- **Migration:** `supabase/migrations/001_hyrox_team_schema.sql`
  - 14 tables: applications → athletes → assessments/testing/race → mapped profiles → programme drafts/weeks/sessions → check-ins, coach notes, status history, payments, session library
  - `public.set_updated_at()` trigger on all tables with `updated_at`
  - Indexes on `athlete_id`, `status`, `created_at` (and common composite keys)
  - Foreign keys with **cascade** only on child rows owned by an athlete (assessments, sessions, etc.); **set null** on optional links (application, user, draft source)
- **Types:** `app/lib/hyroxDatabaseTypes.ts` — status unions, row shapes, `HYROX_TABLES`, `BENCHMARK_KIND_TO_DB_TEST_TYPE`
- **RLS:** enabled on all tables; **active** policy: `anon` + `authenticated` **INSERT** on `hyrox_applications`. Coach/athlete policies documented as SQL comments for Phase 2.

## What remains mocked (unchanged in Phase 1)

| Area | Current source |
|------|----------------|
| Apply form | Formspree (`HyroxTeamApplyFormSection`) — not `hyrox_applications` |
| Athlete onboarding / dashboard | `athletePortalContext`, `hyroxTeamDashboardMock`, locked/active views |
| Assessment UI | Local/mock; mapping in `app/lib/hyroxAssessmentMapping.ts` |
| Testing UI | `app/athlete/testing/hyroxTestingTypes.ts` + modals (no Supabase writes) |
| Coach athlete list / programme builder | `hyroxCoachMockAthletes`, `hyroxCoachProgrammeDraft`, session library in code (`src/lib/hyrox/sessionLibrary.ts`) |
| Stripe checkout | Payment Link URLs in env; no webhooks → `hyrox_payments` yet |
| Auth link | `hyrox_athletes.user_id` column ready; no signup/login flow |

## Next implementation phase (from `docs/hyrox-team-backend-plan.md`)

**Phase 2 — RLS & auth helpers**

- Add `is_hyrox_coach()` / `hyrox_athlete_id_for_user()` (or equivalent via `profiles.role`)
- Coach: full `hyrox_*` access; athlete: own rows; **no** athlete SELECT on `hyrox_programme_drafts`
- Server actions use **service role** where policies are not yet live

**Phase 3 — Applications API**

- Replace Formspree with insert into `hyrox_applications` (rate limiting, validation)
- Coach workflow: accept → create `hyrox_athletes` row

**Phase 4+** — assessments, testing, mapping persistence, publish pipeline, Stripe webhooks (see plan doc).

## How this schema connects to existing modules

```
/hyrox-team/apply          → hyrox_applications (future)
payment / accepted         → hyrox_athletes + hyrox_payments
app/athlete/assessment     → hyrox_assessments.raw_answers + extracted columns
app/athlete/testing        → hyrox_testing_results (+ hyrox_race_results for RoxFit)
app/lib/hyroxAssessmentMapping.ts → hyrox_mapped_profiles
Coach Programme Builder    → hyrox_programme_drafts → publish → hyrox_programme_weeks + hyrox_programme_sessions
app/lib/hyroxCoachProgrammeDraft.ts / PublishBar → draft_data / weekly_summary JSON shape
src/lib/hyrox/sessionLibrary.ts → hyrox_session_library (optional future import)
```

**Important product rule (unchanged):** programmes are only athlete-visible after coach publish into `hyrox_programme_weeks` / `hyrox_programme_sessions` with `status = 'published'`. Drafts stay coach-only.

## Applying the migration

```bash
# With Supabase CLI linked to the project:
supabase db push

# Or paste `supabase/migrations/001_hyrox_team_schema.sql` into the Supabase SQL editor.
```

If `set_updated_at()` already exists from another migration (e.g. daily habits), the `create or replace` in this file is safe.

## Test type naming

UI uses kinds like `run_5k` (`hyroxTestingTypes.ts`). DB uses `five_k_run`, etc. Use `BENCHMARK_KIND_TO_DB_TEST_TYPE` when persisting.
