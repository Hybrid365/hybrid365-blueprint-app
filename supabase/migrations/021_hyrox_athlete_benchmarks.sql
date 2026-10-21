-- HYROX 1-1 performance profile — append-only benchmark history.
-- NOT APPLIED to production by this change. Review and apply separately.
--
-- One row is one result. Programming uses the single active approved row per
-- athlete and benchmark type. Lifetime bests are not chosen automatically.
--
-- Rollback:
--   drop table if exists public.hyrox_athlete_benchmarks;
-- Existing hyrox_testing_results, hyrox_performance_test_results and
-- hyrox_race_results are not altered.

create table if not exists public.hyrox_athlete_benchmarks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  benchmark_type text not null,
  result_value text not null,
  result_unit text not null,
  normalized_value numeric not null,
  normalized_unit text not null,
  derived_value numeric,
  derived_unit text,
  result_date date not null,
  source text not null,
  status text not null default 'pending',
  active_for_programming boolean not null default false,
  context jsonb not null default '{}'::jsonb,
  notes text,
  source_table text,
  source_id uuid,
  submitted_by_user_id uuid,
  approved_by_user_id uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hyrox_athlete_benchmarks_type_check
    check (benchmark_type in (
      'run_5k',
      'run_10k',
      'run_30min',
      'threshold_pace',
      'hyrox_run_pace',
      'ski_1k',
      'ski_2k',
      'row_2k',
      'ftp',
      'hyrox_race',
      'squat',
      'deadlift',
      'bench',
      'military_press'
    )),
  constraint hyrox_athlete_benchmarks_source_check
    check (source in (
      'athlete_submitted',
      'coach_entered',
      'onboarding_test',
      'performance_test',
      'race_result',
      'lab_test',
      'imported'
    )),
  constraint hyrox_athlete_benchmarks_status_check
    check (status in ('pending', 'approved', 'rejected', 'historical')),
  constraint hyrox_athlete_benchmarks_active_approved_check
    check (active_for_programming = false or status = 'approved'),
  constraint hyrox_athlete_benchmarks_normalized_positive_check
    check (normalized_value > 0)
);

create index if not exists hyrox_athlete_benchmarks_athlete_type_date_idx
  on public.hyrox_athlete_benchmarks (athlete_id, benchmark_type, result_date desc);

create index if not exists hyrox_athlete_benchmarks_pending_idx
  on public.hyrox_athlete_benchmarks (athlete_id, created_at desc)
  where status = 'pending';

create unique index if not exists hyrox_athlete_benchmarks_one_active_idx
  on public.hyrox_athlete_benchmarks (athlete_id, benchmark_type)
  where active_for_programming = true;

comment on table public.hyrox_athlete_benchmarks is
  'Append-only HYROX benchmark history. At most one active programming anchor per athlete and type.';

alter table public.hyrox_athlete_benchmarks enable row level security;

drop policy if exists hyrox_athlete_benchmarks_coach_all on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_coach_all
  on public.hyrox_athlete_benchmarks
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_athlete_benchmarks_athlete_select on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_athlete_select
  on public.hyrox_athlete_benchmarks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_benchmarks.athlete_id
        and ha.user_id = auth.uid()
    )
  );

-- Athletes may submit pending results only. They cannot approve or activate.
drop policy if exists hyrox_athlete_benchmarks_athlete_insert on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_athlete_insert
  on public.hyrox_athlete_benchmarks
  for insert
  to authenticated
  with check (
    status = 'pending'
    and active_for_programming = false
    and source = 'athlete_submitted'
    and exists (
      select 1
      from public.hyrox_athletes ha
      where ha.id = hyrox_athlete_benchmarks.athlete_id
        and ha.user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'hyrox_athlete_benchmarks_updated'
      and tgrelid = 'public.hyrox_athlete_benchmarks'::regclass
  ) then
    create trigger hyrox_athlete_benchmarks_updated
    before update on public.hyrox_athlete_benchmarks
    for each row execute function public.set_updated_at();
  end if;
end $$;
