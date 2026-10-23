# Contract: Athlete analytics

Status: proposed. Implementation is local on this worktree (base `origin/main` `679c413`). Default UI flag off. Do not treat this as production behaviour.

Owner: Analytics agent (Workstream B).

Consumers: Athlete Progress, Coach Command Centre (Workstream C), Track automation later.

## Purpose

Expose one honest weekly analytics payload from stored HYROX 1-1 data. Missing stays null. No mock charts, no interpolation, no second shape.

`getHyroxAthleteAnalytics` is the only analytics engine. C must import this resolver and this type.

## Resolver

```ts
getHyroxAthleteAnalytics(
  supabase,
  athleteId,
  options?: { now?: Date; asOf?: Date; timeZone?: string }
): Promise<HyroxAthleteAnalytics>
```

Pure calculation is `computeHyroxAthleteAnalytics`. React must not re-implement the arithmetic. The loader is read-only.

## Frozen output

Field names may gain comments. They must not be renamed and must not be wrapped in a second summary type.

```ts
export type HyroxAnalyticsWeek = {
  startDate: string;
  endDate: string;
  complete: boolean;
  plannedSessions: number;
  completedSessions: number;
  completionPct: number | null;
  runDistanceKm: number | null;
  trainingDurationMinutes: number | null;
  averageRpe: number | null;
  sessionRpeLoad: number | null; // sum duration_minutes * RPE only when both exist
  keySessionsCompleted: number;
  keySessionsPlanned: number;
};
export type HyroxModality = "run" | "bike" | "skierg" | "rowerg" | "strength" | "hyrox_specific" | "other";
export type HyroxModalitySlice = { modality: HyroxModality; durationMinutes: number | null; sessionCount: number };
export type HyroxBenchmarkPoint = { date: string; display: string; normalizedValue: number; source: string; status: string };
export type HyroxAthleteAnalytics = {
  athleteId: string;
  asOf: string;
  currentWeek: HyroxAnalyticsWeek;
  previousWeek: HyroxAnalyticsWeek | null;
  rolling4: {
    runDistanceKm: number | null;
    trainingDurationMinutes: number | null;
    completionPct: number | null;
    averageRpe: number | null;
  };
  distribution: HyroxModalitySlice[];
  benchmarks: { type: string; label: string; points: HyroxBenchmarkPoint[] }[];
  unsupported: string[];
};
```

## Data sources (read-only)

| Source | Table / field | Used for |
| --- | --- | --- |
| Published programme weeks | `hyrox_programme_weeks` (`status = published`) | Planned session set |
| Programme sessions | `hyrox_programme_sessions` | Plan, completion, key-session flag, modality |
| Session log | `status`, `completed_at`, `athlete_feedback` jsonb | Completed count, RPE, duration, run distance |
| Session classification | `athlete_feedback.activityType`, else category / name via `inferSessionActivityType` | Modality slices |
| Key sessions | `isKeyProgrammeSession` | `keySessionsCompleted` |
| Calendar date | `programme_start_date` + week number + `day_of_week`, else published `week_start_date` | Week bucketing |
| Append-only benchmarks | `hyrox_athlete_benchmarks` via `listAthleteBenchmarks` | Benchmark history |

Not queried: `hyrox_check_ins`, `hyrox_daily_readiness`, coach notes, Strava / wearables, community `session_logs`.

HR may exist as optional text on a run/erg log. It is not a complete series, so it is listed in `unsupported`.

## Week windows

Monday–Sunday. `now` becomes local calendar YMD (`asOf`).

- **Current week**: Monday–Sunday containing `asOf`.
- **Previous week**: the Monday–Sunday before current week. Always returned with that date range.
- **Rolling 4**: current week plus the three preceding Monday–Sunday windows.

**Incomplete current weeks are not treated as full weeks.** `complete` is `false` until `asOf` is after Sunday. Remaining later-week sessions stay in `plannedSessions`. Rolling 4 excludes days after `asOf`, so a Wednesday snapshot does not pretend Friday already happened.

A Sunday session and the following Monday session fall in different weeks. Draft / archived weeks are ignored.

## Calculations

| Field | Rule |
| --- | --- |
| `plannedSessions` | Published sessions whose calendar YMD falls in the week window, including Optional, remaining scheduled, missed, and modified. |
| `completedSessions` | `status === "completed"`. Missed and modified are not completed. |
| `completionPct` | `round(100 * completed / planned)` when planned > 0, else `null`. |
| `runDistanceKm` | Sum of logged `metrics.distanceKm` on run sessions. Null if none. Not inferred from the title. |
| `trainingDurationMinutes` | Sum of **logged** duration only. Never prescription or `planned.estimatedDurationMinutes`. |
| `averageRpe` | Mean of parsed RPE values. `"6–7"` uses the highest number. |
| `sessionRpeLoad` | `sum(durationMinutes * rpe)` only when both exist on the same session. Null if none. |
| `keySessionsPlanned` | Planned sessions that pass `isKeyProgrammeSession`. |
| `keySessionsCompleted` | Completed sessions that pass `isKeyProgrammeSession`. |
| `complete` | `true` only when `asOf` is after that week's Sunday. |
| `rolling4.*` | Same rules over `[currentMonday − 21 days, asOf date]`. Remaining later-week sessions are not in the rolling window. |
| `distribution` | Current-week published sessions grouped by modality. |
| `benchmarks` | One series per type with at least one real point, oldest to newest. No interpolated points. Rejected rows omitted. |

## Unsupported metrics

Always listed:

- `heart_rate_load`
- `threshold_easy_minutes`
- `ctl_atl_tsb`
- `check_in_wellness`
- `bodyweight_trend`
- `daily_readiness`
- `strength_logged_duration`
- `inferred_ftp_threshold_hyrox_pace`
- `interpolated_benchmarks`
- `population_percentiles`
- `strava_wearable_volume`
- `race_split_limiters`

## Flag

Athlete Progress UI, default off:

- `HYROX_ANALYTICS_V1_ENABLED=1`
- `HYROX_ANALYTICS_V1_ATHLETE_IDS`
- `HYROX_ANALYTICS_V1_ATHLETE_EMAILS`
- `HYROX_ANALYTICS_V1_DEV_ALL=1` (development only)

Compatibility aliases: `HYROX_ATHLETE_ANALYTICS_*`.

When off, keep the existing Progress screen.

## Out of scope

Prescription engine, coach command-centre chrome, visual primitive library, Home / Programme / Session visual redesign, race-intelligence schema, applying migration 021, enabling Home V2 / Today V2 / Performance Hub.
