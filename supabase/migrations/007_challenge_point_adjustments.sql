-- Manual Hybrid 75 leaderboard point adjustments

create table if not exists public.challenge_point_adjustments (
  id uuid primary key default gen_random_uuid(),
  plan_id text,
  name text,
  email text not null,
  points integer not null check (points >= -500 and points <= 500 and points <> 0),
  reason text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists challenge_point_adjustments_email_idx
  on public.challenge_point_adjustments (lower(email));

create index if not exists challenge_point_adjustments_plan_id_idx
  on public.challenge_point_adjustments (plan_id);

alter table public.challenge_point_adjustments enable row level security;
