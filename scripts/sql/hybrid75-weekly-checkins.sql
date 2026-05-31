-- Hybrid 75 weekly check-ins (mirrors supabase/migrations/008_hybrid75_habits_checkins.sql)

create table if not exists public.hybrid75_weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null,
  email text,
  name text,
  week_start date not null,
  sessions_completed int,
  proof_posts int,
  energy_score int check (energy_score >= 1 and energy_score <= 10),
  recovery_score int check (recovery_score >= 1 and recovery_score <= 10),
  soreness_score int check (soreness_score >= 1 and soreness_score <= 10),
  biggest_win text,
  biggest_struggle text,
  support_needed text,
  interested_full_programme boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, week_start)
);

create index if not exists hybrid75_weekly_checkins_plan_id_idx
  on public.hybrid75_weekly_checkins (plan_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'hybrid75_weekly_checkins_updated'
      and tgrelid = 'public.hybrid75_weekly_checkins'::regclass
  ) then
    create trigger hybrid75_weekly_checkins_updated
    before update on public.hybrid75_weekly_checkins
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.hybrid75_weekly_checkins enable row level security;
