-- Track athlete foundation.
-- Evidence is append-only. Anchors and the performance profile are derived.
-- Athletes may submit and correct evidence. They cannot write anchor provenance.
-- Requires hyrox_athletes and public.is_hyrox_coach().

create table if not exists public.track_athlete_intake (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null unique references public.hyrox_athletes (id) on delete cascade,
  intake jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.track_benchmark_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  test_id text not null,
  result_value text not null,
  unit text not null,
  tested_on date not null,
  source text not null,
  notes text,
  details jsonb not null default '{}'::jsonb,
  corrects_result_id uuid,
  created_at timestamptz not null default now(),
  constraint track_benchmark_results_source_check check (
    source in (
      'official_race',
      'lab_test',
      'coach_test',
      'training_test',
      'self_entered_benchmark',
      'watch_estimate'
    )
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'track_benchmark_results_corrects_result_id_fkey'
      and conrelid = 'public.track_benchmark_results'::regclass
  ) then
    alter table public.track_benchmark_results
      add constraint track_benchmark_results_corrects_result_id_fkey
      foreign key (corrects_result_id) references public.track_benchmark_results (id) on delete set null;
  end if;
end $$;

create index if not exists track_benchmark_results_athlete_idx
  on public.track_benchmark_results (athlete_id, test_id, tested_on);

create table if not exists public.track_training_anchors (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  anchor_key text not null,
  status text not null,
  display_value text,
  provenance jsonb not null default '{}'::jsonb,
  derived_at timestamptz not null default now(),
  unique (athlete_id, anchor_key),
  constraint track_training_anchors_status_check check (status in ('active', 'reassessment_due', 'unavailable'))
);

comment on table public.track_training_anchors is
  'Server-derived. Athletes may read provenance. They may not insert or edit it. Submit evidence instead.';

create table if not exists public.track_performance_profiles (
  athlete_id uuid primary key references public.hyrox_athletes (id) on delete cascade,
  readiness text not null,
  profile jsonb not null default '{}'::jsonb,
  derived_at timestamptz not null default now(),
  constraint track_performance_profiles_readiness_check check (readiness in ('NOT_READY', 'PARTIALLY_READY', 'READY'))
);

comment on table public.track_performance_profiles is
  'Derived profile and programming-ready state. Athlete read-only.';

create table if not exists public.track_assessment_plans (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  requirements jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.track_athlete_intake enable row level security;
alter table public.track_benchmark_results enable row level security;
alter table public.track_training_anchors enable row level security;
alter table public.track_performance_profiles enable row level security;
alter table public.track_assessment_plans enable row level security;

-- Coach / admin
drop policy if exists track_athlete_intake_coach_all on public.track_athlete_intake;
create policy track_athlete_intake_coach_all on public.track_athlete_intake
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_benchmark_results_coach_all on public.track_benchmark_results;
create policy track_benchmark_results_coach_all on public.track_benchmark_results
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_training_anchors_coach_all on public.track_training_anchors;
create policy track_training_anchors_coach_all on public.track_training_anchors
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_performance_profiles_coach_all on public.track_performance_profiles;
create policy track_performance_profiles_coach_all on public.track_performance_profiles
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_assessment_plans_coach_all on public.track_assessment_plans;
create policy track_assessment_plans_coach_all on public.track_assessment_plans
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

-- Athlete: own intake
drop policy if exists track_athlete_intake_athlete_select on public.track_athlete_intake;
create policy track_athlete_intake_athlete_select on public.track_athlete_intake
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_athlete_intake.athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_athlete_intake_athlete_insert on public.track_athlete_intake;
create policy track_athlete_intake_athlete_insert on public.track_athlete_intake
  for insert to authenticated with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_athlete_intake.athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_athlete_intake_athlete_update on public.track_athlete_intake;
create policy track_athlete_intake_athlete_update on public.track_athlete_intake
  for update to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_athlete_intake.athlete_id and ha.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_athlete_intake.athlete_id and ha.user_id = auth.uid())
  );

-- Athlete: insert and read evidence. No update and no delete. Corrections are new rows.
drop policy if exists track_benchmark_results_athlete_select on public.track_benchmark_results;
create policy track_benchmark_results_athlete_select on public.track_benchmark_results
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_benchmark_results.athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_benchmark_results_athlete_insert on public.track_benchmark_results;
create policy track_benchmark_results_athlete_insert on public.track_benchmark_results
  for insert to authenticated with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_benchmark_results.athlete_id and ha.user_id = auth.uid())
  );

-- Athlete: read derived anchors, profile, assessment. No write.
drop policy if exists track_training_anchors_athlete_select on public.track_training_anchors;
create policy track_training_anchors_athlete_select on public.track_training_anchors
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_training_anchors.athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_performance_profiles_athlete_select on public.track_performance_profiles;
create policy track_performance_profiles_athlete_select on public.track_performance_profiles
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_performance_profiles.athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_assessment_plans_athlete_select on public.track_assessment_plans;
create policy track_assessment_plans_athlete_select on public.track_assessment_plans
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = track_assessment_plans.athlete_id and ha.user_id = auth.uid())
  );
