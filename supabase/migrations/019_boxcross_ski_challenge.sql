-- BoxCross UK 1KM Ski Challenge (isolated — service-role access only)

create table if not exists public.boxcross_ski_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'active', 'final', 'archived')),
  male_prize text not null default '£100 Bulk Nutrition',
  female_prize text not null default '£100 Bulk Nutrition',
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists public.boxcross_ski_attempts (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.boxcross_ski_challenges (id) on delete cascade,
  athlete_name text not null,
  category text not null check (category in ('male', 'female')),
  time_ms integer not null check (time_ms > 0),
  attempted_at timestamptz not null,
  verification_method text not null check (verification_method in ('staff_witnessed', 'full_video')),
  verified boolean not null default false,
  verified_by text,
  proof_url text,
  witness_name text,
  internal_notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boxcross_ski_attempts_challenge_id_idx
  on public.boxcross_ski_attempts (challenge_id);

create index if not exists boxcross_ski_attempts_verified_time_idx
  on public.boxcross_ski_attempts (challenge_id, verified, time_ms);

create index if not exists boxcross_ski_attempts_athlete_idx
  on public.boxcross_ski_attempts (challenge_id, lower(athlete_name));

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'boxcross_ski_challenges_updated'
      and tgrelid = 'public.boxcross_ski_challenges'::regclass
  ) then
    create trigger boxcross_ski_challenges_updated
    before update on public.boxcross_ski_challenges
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'boxcross_ski_attempts_updated'
      and tgrelid = 'public.boxcross_ski_attempts'::regclass
  ) then
    create trigger boxcross_ski_attempts_updated
    before update on public.boxcross_ski_attempts
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.boxcross_ski_challenges enable row level security;
alter table public.boxcross_ski_attempts enable row level security;

-- Seed the active 30-day challenge (dates configurable via admin/DB update)
insert into public.boxcross_ski_challenges (
  title,
  slug,
  start_date,
  end_date,
  status,
  male_prize,
  female_prize
)
select
  'BOXCROSS 1KM SKI CHALLENGE',
  'boxcross-1km-ski-challenge',
  timestamptz '2026-07-28 00:00:00+01',
  timestamptz '2026-08-26 23:59:59+01',
  'active',
  '£100 Bulk Nutrition',
  '£100 Bulk Nutrition'
where not exists (
  select 1 from public.boxcross_ski_challenges
  where slug = 'boxcross-1km-ski-challenge'
);
