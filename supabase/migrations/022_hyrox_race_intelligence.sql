-- HYROX race intelligence V1 — numeric seconds, division, goal, Roxzone, structured splits.
-- NOT APPLIED to staging or production by this change.
-- Staging apply refuses numbered migrations above 021
-- (scripts/staging/lib/schemaCatalog.mjs MAX_STAGING_MIGRATION = 21).
-- Do not apply 017_hyrox_daily_readiness.sql or 018_hyrox_admin_preview_audit.sql
-- as part of this work.
--
-- Additive only. Existing total_time, category, run_splits, and station_splits stay.
-- Incomplete races remain valid (new timed columns are nullable).
-- This does not change onboarding upsert behaviour.
--
-- Rollback:
--   drop index if exists public.hyrox_race_results_athlete_race_date_idx;
--   alter table public.hyrox_race_results
--     drop constraint if exists hyrox_race_results_total_time_seconds_check,
--     drop constraint if exists hyrox_race_results_goal_time_seconds_check,
--     drop constraint if exists hyrox_race_results_roxzone_seconds_check;
--   alter table public.hyrox_race_results
--     drop column if exists division,
--     drop column if exists goal_time,
--     drop column if exists goal_time_seconds,
--     drop column if exists total_time_seconds,
--     drop column if exists roxzone_display,
--     drop column if exists roxzone_seconds,
--     drop column if exists split_times;

alter table public.hyrox_race_results
  add column if not exists division text,
  add column if not exists goal_time text,
  add column if not exists goal_time_seconds numeric,
  add column if not exists total_time_seconds numeric,
  add column if not exists roxzone_display text,
  add column if not exists roxzone_seconds numeric,
  add column if not exists split_times jsonb not null default '{}'::jsonb;

update public.hyrox_race_results
  set division = category
  where division is null
    and category is not null
    and btrim(category) <> '';

alter table public.hyrox_race_results
  drop constraint if exists hyrox_race_results_total_time_seconds_check;
alter table public.hyrox_race_results
  add constraint hyrox_race_results_total_time_seconds_check
  check (total_time_seconds is null or total_time_seconds > 0);

alter table public.hyrox_race_results
  drop constraint if exists hyrox_race_results_goal_time_seconds_check;
alter table public.hyrox_race_results
  add constraint hyrox_race_results_goal_time_seconds_check
  check (goal_time_seconds is null or goal_time_seconds > 0);

alter table public.hyrox_race_results
  drop constraint if exists hyrox_race_results_roxzone_seconds_check;
alter table public.hyrox_race_results
  add constraint hyrox_race_results_roxzone_seconds_check
  check (roxzone_seconds is null or roxzone_seconds > 0);

create index if not exists hyrox_race_results_athlete_race_date_idx
  on public.hyrox_race_results (athlete_id, race_date desc nulls last, created_at desc);

comment on column public.hyrox_race_results.division is
  'HYROX division as typed (Open, Pro, Doubles, Adaptive, or a variant).';
comment on column public.hyrox_race_results.split_times is
  'Structured { runs, stations, roxzone } maps of { display, seconds }. Analysis reads seconds only.';
comment on column public.hyrox_race_results.total_time_seconds is
  'Overall finish time in seconds. Display string stays on total_time.';
