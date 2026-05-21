-- Hyrox athlete programme calendar & block progression (idempotent)
-- Run in Supabase SQL editor or: supabase db push
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS only; no drops.

-- ---------------------------------------------------------------------------
-- programme_start_date
-- First calendar day of global Week 1. Drives hyrox_programme_weeks.week_start_date
-- / week_end_date on publish and athlete Past / Live / Upcoming week chips.
-- ---------------------------------------------------------------------------
alter table public.hyrox_athletes
  add column if not exists programme_start_date date;

comment on column public.hyrox_athletes.programme_start_date is
  'First day of global Week 1 for this athlete''s Hyrox programme. NULL until coach sets it in the programme builder or publish flow.';

-- ---------------------------------------------------------------------------
-- programme_length_weeks
-- Total roadmap length (12 or 16). Detailed sessions ship in 4-week blocks.
-- ---------------------------------------------------------------------------
alter table public.hyrox_athletes
  add column if not exists programme_length_weeks integer;

update public.hyrox_athletes
set programme_length_weeks = 12
where programme_length_weeks is null;

alter table public.hyrox_athletes
  alter column programme_length_weeks set default 12;

alter table public.hyrox_athletes
  alter column programme_length_weeks set not null;

comment on column public.hyrox_athletes.programme_length_weeks is
  'Planned programme length in weeks: 12 (3 blocks) or 16 (4 blocks). Default 12.';

do $$
begin
  alter table public.hyrox_athletes
    add constraint hyrox_athletes_programme_length_weeks_check
    check (programme_length_weeks in (12, 16));
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- current_programme_block
-- Which 4-week block the coach/athlete is in (1–4). Mirrors current_block for
-- new code paths; kept in sync with current_block on publish until fully migrated.
-- ---------------------------------------------------------------------------
alter table public.hyrox_athletes
  add column if not exists current_programme_block integer;

update public.hyrox_athletes
set current_programme_block = coalesce(current_block, 1)
where current_programme_block is null;

alter table public.hyrox_athletes
  alter column current_programme_block set default 1;

alter table public.hyrox_athletes
  alter column current_programme_block set not null;

comment on column public.hyrox_athletes.current_programme_block is
  'Active 4-week programme block (1 = weeks 1–4, 2 = weeks 5–8, etc.). Aligned with current_block.';

comment on column public.hyrox_athletes.current_block is
  'Legacy/active block index (1–3 for 12-week, 1–4 for 16-week). Prefer current_programme_block in new code.';

-- ---------------------------------------------------------------------------
-- programme_status (already exists on Phase 1 schema — comment only)
-- ---------------------------------------------------------------------------
comment on column public.hyrox_athletes.programme_status is
  'Coach workflow: not_started | mapped | draft_generated | approved | published, etc. Distinct from status (onboarding).';

-- ---------------------------------------------------------------------------
-- programme_started_at / programme_updated_at
-- When the athlete''s programme calendar was first set / last changed at meta level.
-- ---------------------------------------------------------------------------
alter table public.hyrox_athletes
  add column if not exists programme_started_at timestamptz;

alter table public.hyrox_athletes
  add column if not exists programme_updated_at timestamptz;

comment on column public.hyrox_athletes.programme_started_at is
  'When programme_start_date was first saved or the first block was published.';

comment on column public.hyrox_athletes.programme_updated_at is
  'Last change to programme calendar metadata (start date, length, block).';

-- Backfill timestamps where a start date already exists (e.g. manual seed)
update public.hyrox_athletes
set
  programme_started_at = coalesce(programme_started_at, updated_at),
  programme_updated_at = coalesce(programme_updated_at, updated_at)
where programme_start_date is not null
  and (programme_started_at is null or programme_updated_at is null);
