-- HYROX 1-1 performance profile — append-only benchmark history.
-- NOT APPLIED to production by this change. Review and apply separately.
--
-- One row is one result. Programming uses the single active approved row per
-- athlete and benchmark type. Lifetime bests are not chosen automatically.
--
-- History is append-only in the product: results move to rejected or historical,
-- they are not deleted. No authenticated role has a delete policy. Service-role
-- maintenance (staging resets) can still delete.
--
-- Rollback:
--   drop function if exists public.hyrox_activate_athlete_benchmark(uuid, uuid, uuid, boolean);
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
  -- One originating submission is one row. A retry of the same submission reuses the key;
  -- a retest with the same value on another date or from another submission gets a new key.
  -- Null for imported or legacy rows.
  idempotency_key text,
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
    check (normalized_value > 0),
  constraint hyrox_athlete_benchmarks_idempotency_key_check
    check (idempotency_key is null or length(idempotency_key) between 1 and 300),
  -- Nulls are distinct, so legacy rows without a key never collide.
  constraint hyrox_athlete_benchmarks_idempotency_key
    unique (athlete_id, idempotency_key)
);

create index if not exists hyrox_athlete_benchmarks_athlete_type_date_idx
  on public.hyrox_athlete_benchmarks (athlete_id, benchmark_type, result_date desc);

create index if not exists hyrox_athlete_benchmarks_pending_idx
  on public.hyrox_athlete_benchmarks (athlete_id, created_at desc)
  where status = 'pending';

create index if not exists hyrox_athlete_benchmarks_source_idx
  on public.hyrox_athlete_benchmarks (source_table, source_id)
  where source_id is not null;

create unique index if not exists hyrox_athlete_benchmarks_one_active_idx
  on public.hyrox_athlete_benchmarks (athlete_id, benchmark_type)
  where active_for_programming = true;

comment on table public.hyrox_athlete_benchmarks is
  'Append-only HYROX benchmark history. At most one active programming anchor per athlete and type.';

alter table public.hyrox_athlete_benchmarks enable row level security;

-- Coaches read, add and review. No coach delete policy.
drop policy if exists hyrox_athlete_benchmarks_coach_all on public.hyrox_athlete_benchmarks;

drop policy if exists hyrox_athlete_benchmarks_coach_select on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_coach_select
  on public.hyrox_athlete_benchmarks
  for select
  to authenticated
  using (public.is_hyrox_coach());

drop policy if exists hyrox_athlete_benchmarks_coach_insert on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_coach_insert
  on public.hyrox_athlete_benchmarks
  for insert
  to authenticated
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_athlete_benchmarks_coach_update on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_coach_update
  on public.hyrox_athlete_benchmarks
  for update
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

-- Athletes may submit pending results for themselves only. They cannot approve, activate,
-- claim another source, link a source record, or attribute the row to another user.
-- There is no athlete update or delete policy.
drop policy if exists hyrox_athlete_benchmarks_athlete_insert on public.hyrox_athlete_benchmarks;
create policy hyrox_athlete_benchmarks_athlete_insert
  on public.hyrox_athlete_benchmarks
  for insert
  to authenticated
  with check (
    status = 'pending'
    and active_for_programming = false
    and source = 'athlete_submitted'
    and submitted_by_user_id = auth.uid()
    and approved_by_user_id is null
    and approved_at is null
    and source_table is null
    and source_id is null
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

-- Atomic switch of the programming anchor. Runs in one transaction: either the target is
-- active and every other row of that athlete and type is inactive, or nothing changes.
-- p_approve = true approves a pending row and activates it in the same step.
create or replace function public.hyrox_activate_athlete_benchmark(
  p_athlete_id uuid,
  p_benchmark_id uuid,
  p_actor_user_id uuid default null,
  p_approve boolean default false
)
returns public.hyrox_athlete_benchmarks
language plpgsql
security invoker
set search_path = public
as $$
declare
  target public.hyrox_athlete_benchmarks;
begin
  select * into target
  from public.hyrox_athlete_benchmarks
  where id = p_benchmark_id and athlete_id = p_athlete_id
  for update;

  if not found then
    raise exception 'Result not found.' using errcode = 'P0002';
  end if;

  if p_approve and target.status <> 'pending' then
    raise exception 'Only a pending result can be approved.' using errcode = '22023';
  end if;
  if not p_approve and target.status <> 'approved' then
    raise exception 'Only an approved result can be used for programming.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(target.athlete_id::text || ':' || target.benchmark_type, 0));

  update public.hyrox_athlete_benchmarks
  set active_for_programming = false
  where athlete_id = target.athlete_id
    and benchmark_type = target.benchmark_type
    and active_for_programming
    and id <> target.id;

  update public.hyrox_athlete_benchmarks
  set active_for_programming = true,
      status = 'approved',
      approved_by_user_id = case when p_approve then p_actor_user_id else approved_by_user_id end,
      approved_at = case when p_approve then now() else approved_at end
  where id = target.id
  returning * into target;

  return target;
end;
$$;

revoke all on function public.hyrox_activate_athlete_benchmark(uuid, uuid, uuid, boolean) from public;
revoke all on function public.hyrox_activate_athlete_benchmark(uuid, uuid, uuid, boolean) from anon, authenticated;
grant execute on function public.hyrox_activate_athlete_benchmark(uuid, uuid, uuid, boolean) to service_role;
