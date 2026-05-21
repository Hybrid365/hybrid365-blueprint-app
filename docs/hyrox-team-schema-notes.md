# Hyrox Team schema notes

## Phase 1 — database schema

- **Migration:** `supabase/migrations/001_hyrox_team_schema.sql`
  - 14 `hyrox_*` tables, `set_updated_at()` triggers, indexes, FKs
- **Types:** `app/lib/hyroxDatabaseTypes.ts`
- **RLS (initial):** enabled everywhere; **active** policy: public **INSERT** on `hyrox_applications` only

## Phase 2 — roles, route protection, RLS

### Role model (`profiles.role`)

Migration `002_hyrox_roles_and_rls.sql` adds a column to the **existing** `public.profiles` table:

| Role | Purpose |
|------|---------|
| `member` | Default — existing Hybrid365 dashboard users; no Hyrox coach/athlete portal |
| `athlete` | Hyrox Team athlete portal (`/athlete/*`) |
| `coach` | Hyrox coach dashboard (`/admin/hyrox-*`) |
| `admin` | Same Hyrox access as coach |

**Before applying 002:** confirm `public.profiles` exists in Supabase (standard Hybrid365 project). If missing, create it first — the migration will **fail** with a clear error rather than guessing schema.

### App route protection (Next.js)

| Path | Requirement |
|------|-------------|
| `/dashboard/*` | Authenticated (unchanged) |
| `/admin/hyrox-athletes`, `/admin/hyrox-programme-preview` | Authenticated + coach access |
| `/admin/no-access` | Authenticated only (explains missing coach role) |
| `/athlete/*` | Authenticated + athlete access |
| `/athlete/no-access` | Authenticated only |
| `/hyrox-team/*` | Public (unchanged) |

**Coach access** (any of):

1. `profiles.role` ∈ `coach`, `admin`
2. `INTERNAL_ADMIN_EMAILS` contains user email (same pattern as `/internal/programme-preview`)
3. `HYROX_COACH_EMAILS` contains user email (optional dev bridge)

**Athlete access** (either):

1. `profiles.role` = `athlete`
2. Row in `hyrox_athletes` with `user_id = auth.uid()`

Middleware: `middleware.ts` + `app/lib/supabase/middleware.ts` (`updateHyroxProtectedSession`).

Server layouts (defence in depth): `app/admin/hyrox-athletes/layout.tsx`, `app/admin/hyrox-programme-preview/layout.tsx`.

**Mock workflow:** UI still uses mock data and `sessionStorage` programme toggle. Coaches need login + coach role (or env email allowlist). Athletes need login + athlete role or linked `hyrox_athletes` row — no form wiring yet.

### Code modules

| File | Role |
|------|------|
| `app/lib/hyroxRoles.ts` | Role constants and helpers |
| `app/lib/hyroxAccess.ts` | `getHyroxAccessContext`, layout guards, email allowlists |
| `app/lib/supabase/middleware.ts` | Session refresh + Hyrox gates |

### Supabase RLS (002)

Functions (security definer):

- `is_hyrox_coach()` — `profiles.role` coach/admin
- `hyrox_athlete_id_for_user()` — `hyrox_athletes.user_id = auth.uid()`
- `is_hyrox_athlete()` — athlete role or linked row

Policies summary:

| Table | Public | Athlete | Coach |
|-------|--------|---------|-------|
| `hyrox_applications` | INSERT | — | ALL |
| `hyrox_athletes` | — | SELECT/UPDATE own | ALL |
| `hyrox_programme_drafts` | — | **none** | ALL |
| `hyrox_programme_weeks` | — | SELECT `published` only | ALL |
| `hyrox_programme_sessions` | — | SELECT via published week; UPDATE own | ALL |
| Child tables (assessments, testing, …) | — | Own `athlete_id` | ALL |
| `hyrox_coach_notes` | — | SELECT `visible_to_athlete` | ALL |
| `hyrox_session_library` | — | — | ALL |

Service role bypasses RLS for server routes/webhooks (unchanged).

### Env vars (optional)

```bash
# Comma-separated coach emails until profiles.role is set in DB
HYROX_COACH_EMAILS=coach@example.com

# Existing internal QA allowlist (also grants Hyrox admin routes)
INTERNAL_ADMIN_EMAILS=you@hybrid365.com
```

### Applying migrations

```bash
supabase db push
# Or run 001, 002, 003 in the SQL editor (order matters).
```

## Phase 3 — application submissions

### Apply form → Supabase

- **`POST /api/hyrox/applications`** — public insert into `hyrox_applications` (anon RLS, no service role on client)
- **`/hyrox-team/apply`** posts JSON mapped from existing form fields; same on-page success copy (no payment redirect)
- **`003_hyrox_applications_raw_payload.sql`** — optional extra fields (location, PB, 5k, weekly training, etc.) in `raw_payload` jsonb

### Coach review (`/admin/hyrox-athletes`)

Tabs:

1. **Applications** — live rows from `GET /api/hyrox/applications` (coach auth)
2. **Accepted athletes** — live `hyrox_athletes` (payment + account linking)
3. **Mock coach athletes** — unchanged `hyroxCoachMockAthletes` demo roster

Review modal actions:

| Action | API | Effect |
|--------|-----|--------|
| Mark under review | `PATCH …/applications/[id]` | `status = under_review` |
| Reject | `PATCH` | `status = rejected`, optional `coach_notes` |
| Accept | `POST …/applications/[id]/accept` | `status = accepted`, creates `hyrox_athletes` if none for application/email |

**Accept does not:** create auth users, send email, unlock `/athlete/*`, or confirm payment.

**Manual next steps after accept:** send `/hyrox-team/accepted` payment link; after payment (future webhook) link `user_id`; assessment/testing still mocked in UI.

### API routes (coach-authenticated except public POST)

| Route | Method | Access |
|-------|--------|--------|
| `/api/hyrox/applications` | POST | Public |
| `/api/hyrox/applications` | GET | Coach |
| `/api/hyrox/applications/[id]` | GET, PATCH | Coach |
| `/api/hyrox/applications/[id]/accept` | POST | Coach |

### Application → column mapping (apply form)

| Form field | DB column |
|------------|-----------|
| `full_name` | `name` |
| `email` | `email` |
| `instagram` | `instagram_handle` |
| `hyrox_experience` | `hyrox_experience` |
| `hyrox_pb` / `five_km_time` | `current_level` (PB preferred) |
| `upcoming_race` | `target_event` |
| `main_goal` | `goal` |
| `why_join` | `reason_for_applying` |
| `documented=yes` | `documentation_interest` |
| Other fields | `raw_payload` |

## Phase 4 — manual payment & account linking

### Payment confirmation (coach, no Stripe webhook yet)

- **`POST /api/hyrox/athletes/[id]/confirm-payment`** (coach auth)
  - Sets `hyrox_athletes.payment_status = paid`, `status = payment_confirmed`
  - Inserts `hyrox_payments` row (`status: paid`, optional `payment_link_type` / `amount`, `currency: gbp`)
  - Appends `hyrox_programme_status_history` (`manual_payment_confirmed`)

Coach UI: **Accepted athletes** tab → expand row → **Mark payment confirmed**.

### Link athlete to auth user (by email)

- **`POST /api/hyrox/athletes/[id]/link-user`** body `{ email }` (coach auth)
  - Requires `payment_status = paid`
  - Looks up `auth.users` via service role (`findAuthUserIdByEmail` — same as Whop flow)
  - Sets `hyrox_athletes.user_id`, normalizes `email`
  - Sets `profiles.role = athlete` when role is `member` (service role update)
  - Sets `status` via `getNextHyroxAthleteStatus()` (e.g. `assessment_required` when paid + linked, no submissions yet)

Does **not** auto-create auth users or send email.

### Status helper

- `app/lib/hyroxAthleteStatus.ts` — `getNextHyroxAthleteStatus()`, `suggestedNextAthleteCoachAction()`
- Used on link-user; ready for assessment/testing phases

### Current athlete (server)

- `app/lib/hyroxCurrentAthlete.ts` — `getCurrentHyroxAthlete()` → row where `user_id = auth.uid()`

### Athlete portal gating

- `profiles.role = athlete` but **no** linked `hyrox_athletes` row → `AthleteUnlinkedNotice` (no mock programme toggle)
- Linked row → normal portal; mock programme toggle still available for demo until publish pipeline ships

### Coach API routes (Phase 3–4)

| Route | Method | Access |
|-------|--------|--------|
| `/api/hyrox/athletes` | GET | Coach |
| `/api/hyrox/athletes/[id]/confirm-payment` | POST | Coach |
| `/api/hyrox/athletes/[id]/link-user` | POST | Coach |

### Manual cohort flow

```
Apply → coach accept → hyrox_athletes (pending payment)
→ coach confirm payment → send /hyrox-team/accepted link
→ athlete signs up/logs in → coach link-user by email
→ assessment_required (assessment/testing save in Phase 5+)
```

## Phase 5 — assessment & testing persistence

### Athlete APIs (linked + `payment_status = paid`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hyrox/athlete/assessment` | GET | Latest submitted assessment |
| `/api/hyrox/athlete/assessment` | POST | Save assessment (`values` → `raw_answers` + mapped columns) |
| `/api/hyrox/athlete/testing` | GET | Saved benchmarks + RoxFit race |
| `/api/hyrox/athlete/testing` | POST | Save benchmark (`type: benchmark`) or race (`type: race`) |

**Assessment resubmit policy:** each POST **inserts a new row**; coach/UI use the **latest** by `submitted_at` (not upsert).

After assessment POST → `syncHyroxAthleteStatus()` (typically `testing_required` if no testing yet).

After testing/race POST → status moves toward `coach_reviewing` when assessment exists.

### Portal gating (`app/athlete/layout.tsx`)

1. `profiles.role = athlete` but no `hyrox_athletes.user_id` → unlinked notice  
2. Linked but `payment_status !== paid` → payment pending notice  
3. Paid + linked → assessment/testing pages  

### UI wiring

- `/athlete/assessment` — controlled form state → POST; success CTA to `/athlete/testing`; resubmit supported  
- `/athlete/testing` — modals POST per test; GET hydrates cards on refresh  
- `/athlete/dashboard` — pipeline reflects real assessment/testing flags (programme still locked until coach publishes)  

### Coach

- **Accepted athletes** — flags for assessment / testing / RoxFit; link to live profile review (`/admin/hyrox-athletes/{uuid}?tab=Profile+Review`)  
- **Live UUID coach detail** — `GET /api/hyrox/athletes/[id]` feeds `mapAssessmentToAthleteProfile()` when real assessment exists  
- **Mock tab** — unchanged mock athletes  

### Data mapping

- `app/lib/hyroxAssessmentPayload.ts` — form → DB columns + `buildHyroxAssessmentInputFromRow()`  
- `app/lib/hyroxTestingPayload.ts` — benchmark kinds → `hyrox_testing_results.test_type`  
- RoxFit → `hyrox_race_results`  

**No auto-publish:** submission only updates athlete status toward coach review; programme builder publish flow unchanged.

## Phase 6 — programme draft persistence & publish

### Mapped profiles (`hyrox_mapped_profiles`)

- **Policy:** one active row per athlete — **update** the latest non-`superseded` row, or **insert** if none exists (no version history in v1).
- Coach action: **Save mapped profile** on live Profile Review → `POST /api/hyrox/athletes/[id]/mapped-profile`
- Sets `hyrox_athletes.programme_status = mapped`; athlete `status` stays `coach_reviewing` until draft generated (unless already `draft_generated` / `programme_published`).

### Programme drafts (`hyrox_programme_drafts`) — coach-only

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hyrox/athletes/[id]/programme-draft` | GET | Latest draft + parsed `draft_data` |
| `/api/hyrox/athletes/[id]/programme-draft` | POST | Generate & insert draft (`draft_generated`) |
| `/api/hyrox/programme-drafts/[draftId]` | PATCH | Save edits (`edited`), summary, validation, notes |
| `/api/hyrox/programme-drafts/[draftId]/approve` | POST | `approved` + `programme_status` |
| `/api/hyrox/programme-drafts/[draftId]/publish` | POST | Requires `approved` → weeks + sessions |

**Generate draft:** uses `generateCoachDraftWeek()` + `computeWeeklySummary` / `validateCoachDraft`; updates `hyrox_athletes.status = draft_generated`, `programme_status = draft_generated`; writes `hyrox_programme_status_history`.

**Publish:** inserts `hyrox_programme_weeks` (published) + `hyrox_programme_sessions` (`scheduled`); draft → `published`; athlete → `programme_published` / `programme_status = published`.

**No auto-publish** after assessment/testing.

### Athlete programme read

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/hyrox/athlete/programme` | GET | Published week/sessions only; `visibility`: `coach_reviewing` \| `building` \| `published` |

Athlete dashboard/programme:

- **Published** → real week/sessions from Supabase (`programmeHubLive` in portal context).
- **Draft exists, not published** → locked hub: “programme being built”.
- **Assessment + testing, no draft** → “coach reviewing”.
- **Mock toggle** — dev preview only when no live published programme (`sessionStorage`).

### Session completion (prep only)

`hyrox_programme_sessions.status`: `scheduled` | `completed` | `missed` | `modified`. Live athlete UI: log/complete **disabled** (“coming soon”) until logging API is added.

### Coach UI (live UUID athletes)

- Profile Review: mapped profile saved indicator; **Save mapped profile** / **Generate programme draft** → APIs.
- Programme Builder: “Live draft from Supabase”; Save / Approve / Publish; publish only when **approved**.
- Mock coach athletes tab: unchanged local state.

### Code modules

| File | Role |
|------|------|
| `app/lib/hyroxProgrammeServer.ts` | Upsert profile, draft CRUD, publish, athlete fetch |
| `app/lib/hyroxCoachProgrammeStatusMap.ts` | UI status ↔ DB draft status |
| `components/athlete-command-centre/useAthleteLiveProgramme.ts` | Athlete GET programme hook |

## Athlete onboarding status flow

After `/athlete/login` (default `next=/athlete/onboarding`), athletes land on a **guided status page** that reads live progress from Supabase (via server helpers + existing athlete APIs):

| Step | Meaning |
|------|---------|
| Account activated | Paid + portal linked |
| Assessment | `hyrox_assessments` with `submitted_at` |
| Baseline testing | Core markers and/or `hyrox_race_results` (RoxFit) |
| Coach review | Assessment + at least one test/race on file; no published programme yet |
| Programme build | `hyrox_programme_drafts` in progress (`visibility: building`) |
| Programme live | Published `hyrox_programme_weeks` row |

**Next-action CTAs** (same logic on `/athlete/onboarding` and waiting `/athlete/dashboard`):

- No assessment → **Complete assessment** → `/athlete/assessment`
- Assessment, no testing → **Continue testing** → `/athlete/testing`
- Assessment + testing, coach phase → **Go to dashboard** / **View onboarding status**
- Draft building → **Programme being built** copy + dashboard
- Published → **View programme** → `/athlete/programme`

Code: `app/lib/hyroxAthleteOnboardingFlow.ts`, `app/athlete/onboarding/`, `app/athlete/dashboard/HyroxTeamDashboardLocked.tsx`.

### Dashboard waiting state

When no programme is published, `/athlete/dashboard` shows a **waiting hub** (not an empty broken shell):

- Checklist: assessment / testing / coach review / programme build / programme live (yes/no)
- Pipeline cards and primary CTA from onboarding logic
- Locked preview modules labelled **“Locked until programme is published”** or **“Your coach is building this section.”**
- Mock **Programme live** toggle remains dev-only preview; production unlock requires coach publish.

### Testing across multiple days

`/athlete/testing` persists each benchmark and RoxFit row via `POST /api/hyrox/athlete/testing`. Athletes can save partial progress and return later; the bottom **Testing progress** card shows core/optional counts and links back to dashboard/onboarding.

### Programme gated until publish

Athletes never read `hyrox_programme_drafts`. `/athlete/programme` and the full dashboard hub only show session cards when a **published** week exists (`programmeHubLive` in portal context). Otherwise the programme page shows: *“Your programme is being built. You'll see your first block here once your coach publishes it.”*

### Live dashboard data priority

For athletes with a **published** programme (`programmePublishedLive` from `GET /api/hyrox/athlete/programme`):

| Source | Used for |
|--------|----------|
| `hyrox_athletes` + portal layout | Name, race, target, block/week |
| Published `hyrox_programme_sessions` | Week sessions, next session, completion % |
| `hyrox_testing_results` | Benchmarks page + dashboard snapshot |
| Check-ins (when wired) | Bodyweight charts — placeholder until then |

**Mock data** is used only when:

- No linked athlete / no published programme, or
- Dev **mock preview** toggle is on **and** no live published programme exists (`useMockPreview` in `athletePortalContext`).

Live published programme **always wins** over mock preview; the dev toggle is hidden when `programmePublishedLive` is true.

Central mapping: `app/lib/hyroxAthleteDashboardLive.ts` + `app/lib/hyroxAthleteProgrammeSort.ts` (`resolveNextSession`, Mon→Sun / AM→Main→PM→Optional sort). UI hook: `useAthleteDashboardLive`.

Missing metrics show **“Awaiting data”** or **“Starts after first training week”** — not Alex Morgan / fake chart values.

### Programme page week selector

`/athlete/programme` shows block-relative chips **W1–W4** (from `HYROX_BLOCKS`):

| Chip | When |
|------|------|
| **Live** | Matches the published `hyrox_programme_weeks.week_number` — real session cards, sorted Mon→Sun |
| **Preview** | Future weeks in the block — placeholder only: *Planned — subject to coach review* |
| **Past** | Earlier weeks without published data — locked copy |

Copy: *Future weeks are subject to change based on check-ins and coach review.* No fake session lists for unpublished weeks.

**Coach publish (4-week block):** `POST /api/hyrox/programme-drafts/[draftId]/publish` defaults to `publish_block: true`, which runs `publishProgrammeBlock()` — generates/publishes weeks 1–4 in the athlete’s current block (skips weeks already published). Week focus labels: Base Intro → Base Progression → Base Peak → Deload / Review. Athlete `GET /api/hyrox/athlete/programme` returns `programmeWeeks[]` with sessions per week; tabs show **Not generated** only when that week truly has no published sessions in DB.

**Benchmark snapshot:** `GET /api/hyrox/athlete/testing` includes `snapshot[]` built from all `hyrox_testing_results` rows (`app/lib/hyroxAthleteBenchmarkSnapshot.ts`) — latest value, change vs previous submission, *Not logged yet* when missing. Dashboard `HyroxThisWeekTrackingCard` uses this API (not `MOCK_BENCHMARK_SNAPSHOT`).

## What remains mocked

| Area | Current source |
|------|----------------|
| Coach programme builder (mock tab athletes) | `hyroxCoachMockAthletes` + local state |
| Programme hub preview (no published week) | `sessionStorage` mock toggle |
| Stripe webhooks | Manual payment confirm |
| Session completion logging (live) | Coming soon |

## Next phase (Phase 7+)

- Stripe webhooks  
- Session completion API + athlete log flow  
- See `docs/hyrox-team-backend-plan.md`

## Module map (unchanged)

```
app/lib/hyroxAssessmentMapping.ts  → hyrox_mapped_profiles
app/athlete/testing/hyroxTestingTypes.ts → hyrox_testing_results
Coach builder mocks → hyrox_programme_drafts → weeks/sessions on publish
```

**Rule:** Athletes never read `hyrox_programme_drafts`; only published weeks/sessions.
