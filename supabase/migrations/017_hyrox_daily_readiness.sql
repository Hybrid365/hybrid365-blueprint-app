-- HYROX Team only — daily morning readiness (Today sprint).
-- Additive, reversible. Does not touch community/free-week tables.

create table if not exists public.hyrox_daily_readiness (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  -- Calendar day in the athlete's local timezone (ownership key with athlete_id)
  local_date date not null,
  timezone text not null default 'UTC',
  sleep_quality integer check (sleep_quality is null or (sleep_quality >= 1 and sleep_quality <= 10)),
  energy integer check (energy is null or (energy >= 1 and energy <= 10)),
  motivation integer check (motivation is null or (motivation >= 1 and motivation <= 10)),
  stress integer check (stress is null or (stress >= 1 and stress <= 10)),
  muscle_soreness integer check (muscle_soreness is null or (muscle_soreness >= 1 and muscle_soreness <= 10)),
  feeling_unwell boolean not null default false,
  bodyweight numeric,
  resting_hr integer check (resting_hr is null or (resting_hr >= 30 and resting_hr <= 220)),
  -- Deterministic readiness indicator (0–100). Not a medical score.
  score integer check (score is null or (score >= 0 and score <= 100)),
  category text check (category is null or category in ('green', 'amber', 'red')),
  explanation text,
  coaching_prompt text,
  inputs_json jsonb not null default '{}'::jsonb,
  coach_note_reviewed_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, local_date)
);

create index if not exists hyrox_daily_readiness_athlete_date_idx
  on public.hyrox_daily_readiness (athlete_id, local_date desc);

comment on table public.hyrox_daily_readiness is
  'HYROX Team daily morning readiness check-in. One row per athlete per local calendar day. Informational only — does not auto-change programmes.';

comment on column public.hyrox_daily_readiness.score is
  'Bounded readiness indicator 0–100 from documented rule engine. Not diagnostic.';

alter table public.hyrox_daily_readiness enable row level security;

drop policy if exists hyrox_daily_readiness_coach_all on public.hyrox_daily_readiness;
create policy hyrox_daily_readiness_coach_all
  on public.hyrox_daily_readiness
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_daily_readiness_athlete_select on public.hyrox_daily_readiness;
create policy hyrox_daily_readiness_athlete_select
  on public.hyrox_daily_readiness
  for select
  to authenticated
  using (athlete_id = public.hyrox_athlete_id_for_user());

drop policy if exists hyrox_daily_readiness_athlete_insert on public.hyrox_daily_readiness;
create policy hyrox_daily_readiness_athlete_insert
  on public.hyrox_daily_readiness
  for insert
  to authenticated
  with check (athlete_id = public.hyrox_athlete_id_for_user());

drop policy if exists hyrox_daily_readiness_athlete_update on public.hyrox_daily_readiness;
create policy hyrox_daily_readiness_athlete_update
  on public.hyrox_daily_readiness
  for update
  to authenticated
  using (athlete_id = public.hyrox_athlete_id_for_user())
  with check (athlete_id = public.hyrox_athlete_id_for_user());

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'hyrox_daily_readiness_updated'
      and tgrelid = 'public.hyrox_daily_readiness'::regclass
  ) then
    create trigger hyrox_daily_readiness_updated
    before update on public.hyrox_daily_readiness
    for each row execute function public.set_updated_at();
  end if;
end $$;
