# Contract: Performance Profile

Status: proposed. The implementation lives on unmerged `feature/hyrox-performance-profile-phase-1`. Do not treat this file as deployed behaviour.

Owner: Performance data agent.

Consumers: Athlete product, Coach admin, Prescription engine, Analytics, Track automation.

## Purpose

Remember every benchmark result and expose one active programming anchor per type.

## Result

One row is one result. Required facts:

- athlete id, benchmark type
- raw display value and unit
- normalized numeric value and unit
- optional derived value (pace per km, split per 500m)
- result date, source, status
- `activeForProgramming`
- notes, context (HR, environment, division, reps)
- submitted by, approved by, approved at
- optional `idempotencyKey` (one originating submission; retries reuse the row)

Sources: `athlete_submitted`, `coach_entered`, `onboarding_test`, `performance_test`, `race_result`, `lab_test`, `imported`.

Statuses: `pending`, `approved`, `rejected`, `historical`.

Types for Phase 1: `run_5k`, `run_10k`, `run_30min`, `threshold_pace`, `hyrox_run_pace`, `ski_2k`, `row_2k`, `ftp`, `hyrox_race`. Onboarding 1K ski is `ski_1k`, not 2K. Strength 1/3/5RM may exist as foundation types.

## Invariants

- At most one active row per athlete and type, and it must be approved.
- Athlete insert is pending and inactive.
- Coach approval does not have to activate.
- Activating a row clears the previous active row of that type.
- Fastest lifetime result is not selected automatically.
- A repeated save of the same linked source record, type, value and date does not append a duplicate.
- The same value on another date, or from another source record, is a new row.
- A changed value appends. It does not overwrite the older benchmark row.
- Coaches cannot delete history through RLS. Rejected or historical status is used instead. Service role may delete for staging resets.
- Race results enter as history, not as an active pace.

## Resolver output

`getHyroxAthletePerformanceProfile` returns active anchors only. Missing anchors are null.

```ts
{
  run5k: { resultSeconds, paceSecondsPerKm, resultDate, source } | null
  threshold: { paceSecondsPerKm, thresholdHr, resultDate, source } | null
  hyroxRun: { paceSecondsPerKm, resultDate, source } | null
  ski2k: { resultSeconds, splitSecondsPer500, resultDate, source } | null
  row2k: { resultSeconds, splitSecondsPer500, resultDate, source } | null
  ftp: { watts, resultDate, source } | null
  hyroxRace: { totalSeconds, division, resultDate, source } | null
}
```

No threshold estimate. No HYROX pace estimate. No FTP inferred from a 20-minute test.

## Athlete API

- Read own non-rejected history and the profile.
- Submit a typed result. Response status is pending.
- Preview cookie: read-only. No submit.

## Coach API

- List all statuses, including rejected.
- Add an approved result. Active is an explicit choice.
- Actions: approve, approve and activate, reject, make active, remove active, mark historical, edit notes, correct a value in place.
- Correcting edits the same row. It is not a delete. A new test date or a new attempt is a new row.

## Flag

Athlete UI: `HYROX_PERFORMANCE_PROFILE_ENABLED`, id list, email list, and development `HYROX_PERFORMANCE_PROFILE_DEV_ALL`. Default off.

Coach Performance Profile can ship without the athlete flag. If migration 021 is not applied, GET returns `unavailable` and the coach panel is read-only.

## Known follow-up (not a Phase 1 merge blocker)

A coach-authenticated session with UPDATE permission can technically set `active_for_programming` directly. Product code uses the service-role activation RPC; the unique one-active index still prevents two simultaneous actives; athletes cannot update; the coach UI does not use a direct activation update.

Future hardening: restrict coach UPDATE semantics, or move sensitive state transitions fully behind privileged RPCs. Do not rewrite migration 021 after it is applied on staging; use a later migration if this is tightened.
