-- Paid community session logs — Phase 1 (extend existing table or create if missing)
-- Safe to run multiple times in production.

create table if not exists public.session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  programme_instance_id uuid not null references public.programme_instances (id) on delete cascade,
  week_number int not null check (week_number >= 1 and week_number <= 12),
  session_key text not null,
  session_title text,
  session_day text,
  completed boolean not null default false,
  completed_at timestamptz,
  rpe int check (rpe >= 1 and rpe <= 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, programme_instance_id, week_number, session_key)
);

alter table public.session_logs add column if not exists programme_week_id uuid references public.programme_weeks (id) on delete set null;
alter table public.session_logs add column if not exists session_type text;
alter table public.session_logs add column if not exists session_status text;
alter table public.session_logs add column if not exists duration_minutes integer;
alter table public.session_logs add column if not exists distance_km numeric;
alter table public.session_logs add column if not exists average_pace text;
alter table public.session_logs add column if not exists average_hr integer;
alter table public.session_logs add column if not exists load_notes text;
alter table public.session_logs add column if not exists station_notes text;
alter table public.session_logs add column if not exists proof_url text;
alter table public.session_logs add column if not exists pain_or_tightness text;
alter table public.session_logs add column if not exists raw_log jsonb not null default '{}'::jsonb;

-- Backfill session_status from completed where missing
update public.session_logs
set session_status = case when completed then 'completed' else 'partial' end
where session_status is null;

alter table public.session_logs alter column session_status set default 'completed';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_logs_session_status_check'
      and conrelid = 'public.session_logs'::regclass
  ) then
    alter table public.session_logs
      add constraint session_logs_session_status_check
      check (session_status in ('completed', 'partial', 'skipped', 'moved'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_logs_duration_minutes_check'
      and conrelid = 'public.session_logs'::regclass
  ) then
    alter table public.session_logs
      add constraint session_logs_duration_minutes_check
      check (duration_minutes is null or duration_minutes >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_logs_average_hr_check'
      and conrelid = 'public.session_logs'::regclass
  ) then
    alter table public.session_logs
      add constraint session_logs_average_hr_check
      check (average_hr is null or (average_hr >= 40 and average_hr <= 230));
  end if;
end $$;

create index if not exists session_logs_user_instance_idx
  on public.session_logs (user_id, programme_instance_id);

create index if not exists session_logs_week_idx
  on public.session_logs (programme_instance_id, week_number);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'session_logs_updated'
      and tgrelid = 'public.session_logs'::regclass
  ) then
    create trigger session_logs_updated
    before update on public.session_logs
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.session_logs enable row level security;

drop policy if exists "session_logs_select_own" on public.session_logs;
create policy "session_logs_select_own" on public.session_logs
  for select using (auth.uid() = user_id);

drop policy if exists "session_logs_insert_own" on public.session_logs;
create policy "session_logs_insert_own" on public.session_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "session_logs_update_own" on public.session_logs;
create policy "session_logs_update_own" on public.session_logs
  for update using (auth.uid() = user_id);

drop policy if exists "session_logs_delete_own" on public.session_logs;
create policy "session_logs_delete_own" on public.session_logs
  for delete using (auth.uid() = user_id);

comment on table public.session_logs is
  'Paid Hybrid365 community dashboard session completion logs.';
