-- Hybrid365 Hyrox Team — Performance Testing (Release 1)
-- Requires: 001_hyrox_team_schema.sql (hyrox_athletes, hyrox_programme_weeks)
-- Requires: public.is_hyrox_coach() from 002_hyrox_roles_and_rls.sql or 005_hyrox_block_reviews.sql
--
-- Rerunnable: safe to run multiple times. Does not reference hyrox_athlete_id_for_user().
-- Athlete access uses hyrox_athletes.user_id = auth.uid() via EXISTS subquery.

-- ---------------------------------------------------------------------------
-- 1. hyrox_performance_test_results
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_performance_test_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  programme_week_id uuid references public.hyrox_programme_weeks (id) on delete set null,
  test_week_id text not null,
  test_type text not null,
  test_date date,
  status text not null default 'not_started',
  result_json jsonb not null default '{}'::jsonb,
  notes text,
  video_url text,
  proof_url text,
  coach_reviewed boolean not null default false,
  coach_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hyrox_performance_test_results_status_check'
      and conrelid = 'public.hyrox_performance_test_results'::regclass
  ) then
    alter table public.hyrox_performance_test_results
      add constraint hyrox_performance_test_results_status_check
      check (status in ('not_started', 'draft', 'submitted', 'reviewed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'hyrox_performance_test_results_athlete_week_type_key'
      and conrelid = 'public.hyrox_performance_test_results'::regclass
  ) then
    alter table public.hyrox_performance_test_results
      add constraint hyrox_performance_test_results_athlete_week_type_key
      unique (athlete_id, test_week_id, test_type);
  end if;
end $$;

create index if not exists hyrox_performance_test_results_athlete_id_idx
  on public.hyrox_performance_test_results (athlete_id);

create index if not exists hyrox_performance_test_results_programme_week_id_idx
  on public.hyrox_performance_test_results (programme_week_id);

create index if not exists hyrox_performance_test_results_test_week_id_idx
  on public.hyrox_performance_test_results (test_week_id);

create index if not exists hyrox_performance_test_results_status_idx
  on public.hyrox_performance_test_results (status);

-- ---------------------------------------------------------------------------
-- 2. hyrox_athlete_recovery_baselines
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_athlete_recovery_baselines (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  test_week_id text not null,
  resting_hr_baseline integer not null,
  baseline_days integer not null,
  average_hrv numeric,
  average_sleep_minutes numeric,
  average_daily_steps integer,
  average_training_hours numeric,
  device_source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hyrox_athlete_recovery_baselines_athlete_week_key'
      and conrelid = 'public.hyrox_athlete_recovery_baselines'::regclass
  ) then
    alter table public.hyrox_athlete_recovery_baselines
      add constraint hyrox_athlete_recovery_baselines_athlete_week_key
      unique (athlete_id, test_week_id);
  end if;
end $$;

create index if not exists hyrox_athlete_recovery_baselines_athlete_id_idx
  on public.hyrox_athlete_recovery_baselines (athlete_id);

create index if not exists hyrox_athlete_recovery_baselines_test_week_id_idx
  on public.hyrox_athlete_recovery_baselines (test_week_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.hyrox_performance_test_results enable row level security;
alter table public.hyrox_athlete_recovery_baselines enable row level security;

-- ---------------------------------------------------------------------------
-- 4. hyrox_performance_test_results policies
-- ---------------------------------------------------------------------------

-- Coach / admin: full access (existing HYROX Team pattern)
drop policy if exists hyrox_performance_test_results_coach_all on public.hyrox_performance_test_results;
create policy hyrox_performance_test_results_coach_all
  on public.hyrox_performance_test_results
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

-- Athlete: read own rows
drop policy if exists hyrox_performance_test_results_athlete_select on public.hyrox_performance_test_results;
create policy hyrox_performance_test_results_athlete_select
  on public.hyrox_performance_test_results
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_performance_test_results.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- Athlete: insert own rows
drop policy if exists hyrox_performance_test_results_athlete_insert on public.hyrox_performance_test_results;
create policy hyrox_performance_test_results_athlete_insert
  on public.hyrox_performance_test_results
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_performance_test_results.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- Athlete: update own rows
drop policy if exists hyrox_performance_test_results_athlete_update on public.hyrox_performance_test_results;
create policy hyrox_performance_test_results_athlete_update
  on public.hyrox_performance_test_results
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_performance_test_results.athlete_id
        and ha.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_performance_test_results.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. hyrox_athlete_recovery_baselines policies
-- ---------------------------------------------------------------------------

-- Coach / admin: full access (existing HYROX Team pattern)
drop policy if exists hyrox_athlete_recovery_baselines_coach_all on public.hyrox_athlete_recovery_baselines;
create policy hyrox_athlete_recovery_baselines_coach_all
  on public.hyrox_athlete_recovery_baselines
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

-- Athlete: read own rows
drop policy if exists hyrox_athlete_recovery_baselines_athlete_select on public.hyrox_athlete_recovery_baselines;
create policy hyrox_athlete_recovery_baselines_athlete_select
  on public.hyrox_athlete_recovery_baselines
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_recovery_baselines.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- Athlete: insert own rows
drop policy if exists hyrox_athlete_recovery_baselines_athlete_insert on public.hyrox_athlete_recovery_baselines;
create policy hyrox_athlete_recovery_baselines_athlete_insert
  on public.hyrox_athlete_recovery_baselines
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_recovery_baselines.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- Athlete: update own rows
drop policy if exists hyrox_athlete_recovery_baselines_athlete_update on public.hyrox_athlete_recovery_baselines;
create policy hyrox_athlete_recovery_baselines_athlete_update
  on public.hyrox_athlete_recovery_baselines
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_recovery_baselines.athlete_id
        and ha.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_recovery_baselines.athlete_id
        and ha.user_id = auth.uid()
    )
  );
