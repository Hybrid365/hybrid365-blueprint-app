-- Coach weekly review notes per programme week (Hyrox Team admin).

create table if not exists public.hyrox_weekly_coach_reviews (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  week_number integer not null,
  programme_week_id uuid references public.hyrox_programme_weeks (id) on delete set null,
  coach_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hyrox_weekly_coach_reviews_week_check check (week_number >= 1),
  constraint hyrox_weekly_coach_reviews_athlete_week_unique unique (athlete_id, week_number)
);

create index if not exists hyrox_weekly_coach_reviews_athlete_id_idx
  on public.hyrox_weekly_coach_reviews (athlete_id);

create index if not exists hyrox_weekly_coach_reviews_athlete_week_idx
  on public.hyrox_weekly_coach_reviews (athlete_id, week_number);

comment on table public.hyrox_weekly_coach_reviews is
  'Coach weekly review notes for a single Hyrox programme week (admin only).';

alter table public.hyrox_weekly_coach_reviews enable row level security;

drop policy if exists hyrox_weekly_coach_reviews_coach_all on public.hyrox_weekly_coach_reviews;
create policy hyrox_weekly_coach_reviews_coach_all
  on public.hyrox_weekly_coach_reviews
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());
