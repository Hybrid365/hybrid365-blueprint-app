# Contract: Athlete Home D

Status: Athlete Experience Phase 1 — productionise visual-lab Home D against published programme data.

Owner: Athlete product.

## Rollout

- Flag: `HYROX_HOME_D_ATHLETE_IDS` (allow-list only). Optional local `HYROX_HOME_D_DEV_ALL=1`.
- **Do not** add global `HYROX_HOME_D_ENABLED=1` for production.
- **Do not** reuse `HYROX_HOME_V2_*`.
- Default OFF — legacy `AthleteHomeDashboard` remains.

## Data rules

1. Athlete reads **canonical published** programme only (`athlete_id + week_number`).
2. Coach unpublished draft revisions never appear on Home D.
3. No invented paces, FTP, readiness, or motivational filler.
4. Athlete-safe titles via `sanitizeAthleteSessionTitle` / published facing titles.
5. Internal coach notes, family IDs, stage labels, automationEligibility never surface.
6. Adaptation “adjustment” message only when accepted → applied → published is **traceable**. Today that chain is **not** stored → Home returns `adjustmentMessage: null`.

## View model

`buildAthleteHomeDViewModel` (pure) composes:

- week Mon–Sun days from published sessions + programme week dates
- selected-day session cards
- coachContext from athlete-facing week note only (or null)
- performanceInsight / progressSnapshot from real benchmark snapshot (or null)

## UI

- Sticky Mon–Sun selector; in-place day swap
- Session card → existing `SessionDrawer`
- Nav when allow-listed: Home · Programme · Progress · Performance · More
- Empty / loading / error without fake stats

## Out of scope

Full Progress/Performance redesign, Track automation, readiness scores, Home V2 expansion.
