-- Hybrid 75 daily habit logs (mirrors supabase/migrations/008_hybrid75_habits_checkins.sql)

create table if not exists public.hybrid75_habit_logs (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null,
  email text,
  name text,
  habit_key text not null,
  habit_label text not null,
  log_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, habit_key, log_date)
);

create index if not exists hybrid75_habit_logs_plan_id_idx
  on public.hybrid75_habit_logs (plan_id);

create index if not exists hybrid75_habit_logs_plan_date_idx
  on public.hybrid75_habit_logs (plan_id, log_date);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'hybrid75_habit_logs_updated'
      and tgrelid = 'public.hybrid75_habit_logs'::regclass
  ) then
    create trigger hybrid75_habit_logs_updated
    before update on public.hybrid75_habit_logs
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.hybrid75_habit_logs enable row level security;
