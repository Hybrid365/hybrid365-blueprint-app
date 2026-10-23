# Contract: Race Intelligence

Status: Batch 1 integration. Migration `022_hyrox_race_intelligence.sql` is **not applied** to staging or production. Athlete and coach Races UI default OFF behind `HYROX_RACE_INTELLIGENCE_*`.

Owner: Race intelligence agent.

Consumers: Athlete product, Coach admin. Future: HYROX run pace, race plan, station targets, race week, prescription engine. Those consumers are named here only — they are not wired in V1.

## Purpose

Remember every HYROX race as history, store splits as numeric seconds plus display strings, and surface transparent observations from **this athlete's stored splits**. No magic scores. No population percentiles. Training is not changed automatically.

## Audit (current main / this branch before V1)

| Surface | What exists | Constraint |
| --- | --- | --- |
| `hyrox_race_results` (001) | One row can hold `race_event`, `race_date`, `category`, `total_time` (text), `run_splits` / `station_splits` (jsonb display maps), self-reported `weakest_station` / `weakest_run` / `biggest_limiter`, `notes` | No numeric seconds. No `division` distinct from `category`. No goal time. No Roxzone column. Incomplete races are allowed by schema (all split fields nullable). |
| Onboarding RoxFit | `upsertHyroxRaceResult` writes the testing form into `hyrox_race_results` | **Overwrites the latest row** for the athlete. Not append-only. Fetches `limit(1)`. |
| Assessment / athlete row | `hyrox_athletes.race_name`, `race_date`, `race_category`, `target_time` | Upcoming race / goal. **Not** a result. Must not appear as race history. |
| Performance Profile | `hyrox_athlete_benchmarks` type `hyrox_race`, source `race_result` | Overall time as benchmark history. Not split analysis. A race result is not an active HYROX pace. |
| Staging seed | Demo competitive / high-performance insert overall time + division in `category` | No splits. Developing demo has `race: null`. |
| Athlete `/athlete/race-prep` | Placeholder: race-day pacing is not built | Must not invent sample races. |
| Coach admin | Roster chip `hasRaceResult` / “RoxFit ✓” | Count only. No splits, comparison, or observations. |
| Staging apply | Allows migrations `001`–`021` | **022 is refused.** Do not apply 022 in this task. |

RLS today: coaches all rows; athletes select/insert/update own `hyrox_race_results`. Service role bypasses RLS — APIs still check coach or athlete first.

## Race record

One row is one race. Incomplete races are valid.

Required:

- athlete id
- event name
- date (nullable only for legacy rows that never stored one; new writes should include it)
- division (Open, Pro, Doubles, Adaptive, or a free-text variant)

Optional:

- category (age group or other label; not a second division)
- overall time
- goal time
- notes (athlete-visible race notes — not an internal coach note)
- splits: runs 1–8, stations in HYROX order, Roxzone

Stations, in order:

1. SkiErg
2. Sled Push
3. Sled Pull
4. Burpee Broad Jumps
5. Row
6. Farmers Carry
7. Sandbag Lunges
8. Wall Balls

Each timed fact stores **both**:

- `display` — the string the athlete or coach typed (`1:03:40`, `4:12`)
- `seconds` — numeric seconds for analysis, or null if the display was empty or malformed

Analysis reads `seconds` only. It must not reparse UI strings.

Self-reported onboarding fields (`weakest_station`, `weakest_run`, `biggest_limiter`) are context. They are not observations.

## Invariants

- History is append-only on the race-intelligence write path. A new race is a new row. Correcting a typo on the same race may update that row; a later event is never stored by overwriting an earlier one.
- Onboarding RoxFit upsert still overwrites the latest row until a follow-up changes it. Race intelligence does not call that upsert.
- Missing data stays null. Do not estimate Roxzone as overall minus runs minus stations. Do not fill empty splits.
- Malformed clocks keep the display string and set `seconds` to null. They do not fail the rest of the race.
- No population rank, percentile, “bottom 20%”, or invented limiter score.
- Observations are sentences about stored numbers (“Wall Balls 42s slower than previous race”).
- Race intelligence does not activate a programming anchor, rewrite a published session, or change the prescription engine.
- Preview is read-only. Internal coach notes never appear in the athlete payload.
- Demo / mock athletes are not shown as live results.

## Analysis V1

Input: the current race record plus the previous race (earlier `race_date`, then earlier `created_at`). Output is derived only from splits (and overall / goal) that already have `seconds`.

| Output | Rule |
| --- | --- |
| Average / fastest / slowest run | From run splits that have seconds. Omit if none. |
| Run fade | Last recorded run minus first recorded run. Positive = later run slower. Omit if fewer than two run splits. |
| Total station time | Sum of station splits that have seconds. Omit if none. |
| Roxzone | Stored Roxzone seconds only. If missing, say so. Never invent. |
| Station distribution | Each recorded station as a share of **recorded** station time. Label the base (“of recorded station time”). |
| vs previous overall | Current overall minus previous overall when both have seconds. Positive = slower. |
| vs previous station / average run | Same subtraction, only for keys present on both races. |
| vs goal | Overall minus goal when both have seconds. Positive = outside the goal. |

Completeness (display only, not a score):

- `none` — name/date only
- `overall_only` — overall time, no split seconds
- `partial` — at least one split, but not all 8 runs and 8 stations
- `full` — 8 runs and 8 stations with seconds; Roxzone may still be missing

## APIs

Athlete:

- `GET /api/hyrox/athlete/races` — own races, newest first, with V1 analysis. Preview cookie: blocked (use coach GET from View-as-Athlete).
- `POST /api/hyrox/athlete/races` — append a pending-quality record (same shape). Preview: 403 `PREVIEW_READONLY`.

Coach:

- `GET /api/hyrox/athletes/:id/races` — all races plus analysis and previous comparison.
- `POST /api/hyrox/athletes/:id/races` — append an approved-quality record. Never overwrite another race.

Event name is required on POST. Everything else may be empty. Unknown division strings are stored as typed.

Until 022 is applied, writes use 001 columns (`total_time`, `category` as division, `run_splits` / `station_splits` display maps). The mapper parses display → seconds **once** at the boundary. After 022, writes also persist `*_seconds` and `split_times` so analysis never needs to parse again.

## UI

Athlete (`/athlete/race-prep`): list of races with result, division, date, progress vs previous or goal, expand for breakdown. Honest empty state. Race-week pacing / fuelling / taper remain “not available yet”. Hidden unless `HYROX_RACE_INTELLIGENCE_*` is on for that athlete.

Coach (athlete admin **Races** tab): result, splits, previous comparison, notes, data-derived observations. Self-report is labelled as athlete-reported. Mock roster athletes have no invented races.

## Schema (022, unapplied)

Additive columns on `hyrox_race_results`: `division`, `goal_time`, `goal_time_seconds`, `total_time_seconds`, `roxzone_display`, `roxzone_seconds`, `split_times jsonb`. Existing display columns stay. Rollback is `drop column` / `drop index` — not `drop table`.

Staging apply currently allows only through 021. **Do not apply 022** until a human changes `MAX_STAGING_MIGRATION` and approves it. Do not apply 017, 018, or anything to production in this work.

## Future interface (not wired)

Named so later work can attach without inventing a second race model:

| Consumer | Race intelligence will later expose | Must not happen in V1 |
| --- | --- | --- |
| HYROX run pace | Average recorded race-run pace from splits that exist | Do not derive threshold or HYROX pace for programming |
| Race plan | Per-run and per-station targets the coach publishes | Do not auto-write a plan from one result |
| Station targets | Station seconds from the last complete race as a starting point | Coach still sets the target |
| Race week | Upcoming `hyrox_athletes.race_date` plus taper copy | Race-prep page does not prescribe |
| Prescription engine | Optional read of last race overall / station seconds as **context**, never as an active anchor | Do not resolve `@5K` from a race; do not rewrite published sessions |

## Out of scope

Population norms, RoxFit screenshot OCR, automatic limiter scoring, overwriting onboarding history, enabling Home V2 / Today V2 / Performance Hub flags, applying SQL to staging or production.
