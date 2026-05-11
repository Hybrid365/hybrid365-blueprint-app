-- Local/manual SQL for paid dashboard session logging table.
-- Safe to run multiple times in development.

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

do $$
begin
  if not exists (
    select 1
    from pg_trigger
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
