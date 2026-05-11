-- Hybrid365 Milestone 13B — daily habit logs (run in Supabase SQL editor or psql).
-- One row per user per calendar day. programme_instance_id optional.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.daily_habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  programme_instance_id uuid references public.programme_instances (id) on delete set null,
  log_date date not null,
  water_hit boolean not null default false,
  protein_hit boolean not null default false,
  steps_hit boolean not null default false,
  sleep_hit boolean not null default false,
  mobility_hit boolean not null default false,
  proof_posted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create index if not exists daily_habit_logs_user_date_idx
  on public.daily_habit_logs (user_id, log_date desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'daily_habit_logs_updated'
      and tgrelid = 'public.daily_habit_logs'::regclass
  ) then
    create trigger daily_habit_logs_updated
    before update on public.daily_habit_logs
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.daily_habit_logs enable row level security;

drop policy if exists "daily_habit_logs_select_own" on public.daily_habit_logs;
create policy "daily_habit_logs_select_own" on public.daily_habit_logs
for select using (auth.uid() = user_id);

drop policy if exists "daily_habit_logs_insert_own" on public.daily_habit_logs;
create policy "daily_habit_logs_insert_own" on public.daily_habit_logs
for insert with check (auth.uid() = user_id);

drop policy if exists "daily_habit_logs_update_own" on public.daily_habit_logs;
create policy "daily_habit_logs_update_own" on public.daily_habit_logs
for update using (auth.uid() = user_id);
