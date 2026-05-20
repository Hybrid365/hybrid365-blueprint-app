-- Hybrid365 Hyrox Team — Phase 1 schema
-- Run via Supabase CLI (`supabase db push`) or SQL editor.
-- Does not wire frontend; establishes tables, indexes, updated_at triggers, RLS shell.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Future Phase 2: uncomment when profiles.role exists (coach | admin | athlete).
-- create or replace function public.is_hyrox_coach()
-- returns boolean
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select exists (
--     select 1
--     from public.profiles p
--     where p.id = auth.uid()
--       and p.role in ('coach', 'admin')
--   );
-- $$;

-- create or replace function public.hyrox_athlete_id_for_user()
-- returns uuid
-- language sql
-- stable
-- security definer
-- set search_path = public
-- as $$
--   select a.id
--   from public.hyrox_athletes a
--   where a.user_id = auth.uid()
--   limit 1;
-- $$;

-- ---------------------------------------------------------------------------
-- 1. hyrox_applications
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  instagram_handle text,
  phone text,
  hyrox_experience text,
  current_level text,
  target_event text,
  target_date date,
  goal text,
  reason_for_applying text,
  documentation_interest boolean not null default false,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  coach_notes text
);

create index if not exists hyrox_applications_status_idx
  on public.hyrox_applications (status);

create index if not exists hyrox_applications_created_at_idx
  on public.hyrox_applications (created_at desc);

create index if not exists hyrox_applications_email_idx
  on public.hyrox_applications (lower(email));

-- ---------------------------------------------------------------------------
-- 2. hyrox_athletes
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_athletes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  application_id uuid references public.hyrox_applications (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  status text not null default 'accepted'
    check (status in (
      'accepted',
      'payment_confirmed',
      'assessment_required',
      'assessment_submitted',
      'testing_required',
      'testing_submitted',
      'coach_reviewing',
      'draft_generated',
      'programme_published'
    )),
  race_name text,
  race_date date,
  race_category text,
  target_time text,
  current_block integer not null default 1,
  current_week integer not null default 1,
  programme_status text not null default 'not_started',
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  stripe_customer_id text,
  stripe_subscription_id text,
  coach_notes text
);

create index if not exists hyrox_athletes_user_id_idx
  on public.hyrox_athletes (user_id);

create index if not exists hyrox_athletes_application_id_idx
  on public.hyrox_athletes (application_id);

create index if not exists hyrox_athletes_status_idx
  on public.hyrox_athletes (status);

create index if not exists hyrox_athletes_payment_status_idx
  on public.hyrox_athletes (payment_status);

create index if not exists hyrox_athletes_email_idx
  on public.hyrox_athletes (lower(email));

-- ---------------------------------------------------------------------------
-- 3. hyrox_assessments
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_assessments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  raw_answers jsonb not null default '{}'::jsonb,
  training_days integer,
  weekly_training_hours numeric,
  current_weekly_run_volume_km numeric,
  five_k_time text,
  ten_k_time text,
  max_heart_rate integer,
  threshold_heart_rate integer,
  station_weaknesses text[],
  equipment_access text[],
  injury_flags text[],
  sleep_quality text,
  stress_level text,
  bodyweight numeric,
  body_composition_goal text,
  documentation_consent boolean not null default false,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted'))
);

create index if not exists hyrox_assessments_athlete_id_idx
  on public.hyrox_assessments (athlete_id);

create index if not exists hyrox_assessments_athlete_submitted_idx
  on public.hyrox_assessments (athlete_id, submitted_at desc nulls last);

-- ---------------------------------------------------------------------------
-- 4. hyrox_testing_results
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_testing_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  test_type text not null
    check (test_type in (
      'five_k_run',
      'one_k_ski',
      'two_k_row',
      'mini_compromised',
      'farmer_hold',
      'sandbag_lunge_capacity',
      'wall_ball_capacity',
      'sled_exposure'
    )),
  test_date date,
  result jsonb not null default '{}'::jsonb,
  rpe integer check (rpe is null or (rpe >= 1 and rpe <= 10)),
  notes text,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted'))
);

create index if not exists hyrox_testing_results_athlete_id_idx
  on public.hyrox_testing_results (athlete_id);

create index if not exists hyrox_testing_results_athlete_test_type_idx
  on public.hyrox_testing_results (athlete_id, test_type);

create index if not exists hyrox_testing_results_created_at_idx
  on public.hyrox_testing_results (created_at desc);

-- ---------------------------------------------------------------------------
-- 5. hyrox_race_results
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_race_results (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  race_event text not null,
  race_date date,
  category text,
  total_time text,
  bodyweight numeric,
  run_splits jsonb,
  station_splits jsonb,
  weakest_station text,
  weakest_run text,
  biggest_limiter text,
  notes text,
  roxfit_screenshot_url text
);

create index if not exists hyrox_race_results_athlete_id_idx
  on public.hyrox_race_results (athlete_id);

create index if not exists hyrox_race_results_athlete_created_idx
  on public.hyrox_race_results (athlete_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. hyrox_mapped_profiles
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_mapped_profiles (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  mapped_profile jsonb not null default '{}'::jsonb,
  coach_overrides jsonb,
  effective_profile jsonb not null default '{}'::jsonb,
  athlete_level text,
  main_limiter text,
  secondary_limiter text,
  recovery_risk text,
  double_session_readiness text,
  first_block_focus text,
  coach_review_flags jsonb,
  status text not null default 'mapped'
    check (status in ('mapped', 'coach_reviewed', 'superseded'))
);

create index if not exists hyrox_mapped_profiles_athlete_id_idx
  on public.hyrox_mapped_profiles (athlete_id);

create index if not exists hyrox_mapped_profiles_athlete_created_idx
  on public.hyrox_mapped_profiles (athlete_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7. hyrox_programme_drafts (coach-only until published via weeks/sessions)
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_programme_drafts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  mapped_profile_id uuid references public.hyrox_mapped_profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  block_number integer not null default 1,
  week_number integer not null default 1,
  draft_data jsonb not null default '{}'::jsonb,
  weekly_summary jsonb,
  validation_warnings jsonb,
  coach_note text,
  athlete_facing_note text,
  status text not null default 'draft_generated'
    check (status in (
      'draft_generated',
      'coach_reviewing',
      'edited',
      'approved',
      'published',
      'archived'
    )),
  published_at timestamptz
);

create index if not exists hyrox_programme_drafts_athlete_id_idx
  on public.hyrox_programme_drafts (athlete_id);

create index if not exists hyrox_programme_drafts_athlete_block_week_idx
  on public.hyrox_programme_drafts (athlete_id, block_number, week_number);

create index if not exists hyrox_programme_drafts_status_idx
  on public.hyrox_programme_drafts (status);

-- ---------------------------------------------------------------------------
-- 8. hyrox_programme_weeks (athlete-visible when published)
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_programme_weeks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  source_draft_id uuid references public.hyrox_programme_drafts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  block_number integer not null default 1,
  week_number integer not null,
  week_start_date date,
  week_end_date date,
  weekly_focus text,
  coach_note text,
  athlete_facing_note text,
  weekly_summary jsonb,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default now()
);

create index if not exists hyrox_programme_weeks_athlete_id_idx
  on public.hyrox_programme_weeks (athlete_id);

create index if not exists hyrox_programme_weeks_athlete_block_week_idx
  on public.hyrox_programme_weeks (athlete_id, block_number, week_number);

create index if not exists hyrox_programme_weeks_status_idx
  on public.hyrox_programme_weeks (status);

-- ---------------------------------------------------------------------------
-- 9. hyrox_programme_sessions
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_programme_sessions (
  id uuid primary key default gen_random_uuid(),
  programme_week_id uuid not null references public.hyrox_programme_weeks (id) on delete cascade,
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  day_of_week text not null,
  session_slot text not null
    check (session_slot in ('AM', 'PM', 'Optional', 'Main')),
  session_name text not null,
  category text not null,
  prescription jsonb not null default '{}'::jsonb,
  metadata jsonb,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'missed', 'modified')),
  completed_at timestamptz,
  athlete_feedback jsonb
);

create index if not exists hyrox_programme_sessions_week_id_idx
  on public.hyrox_programme_sessions (programme_week_id);

create index if not exists hyrox_programme_sessions_athlete_id_idx
  on public.hyrox_programme_sessions (athlete_id);

create index if not exists hyrox_programme_sessions_status_idx
  on public.hyrox_programme_sessions (status);

-- ---------------------------------------------------------------------------
-- 10. hyrox_check_ins
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_check_ins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  programme_week_id uuid references public.hyrox_programme_weeks (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  week_number integer,
  sleep integer check (sleep is null or (sleep >= 1 and sleep <= 10)),
  energy integer check (energy is null or (energy >= 1 and energy <= 10)),
  stress integer check (stress is null or (stress >= 1 and stress <= 10)),
  soreness integer check (soreness is null or (soreness >= 1 and soreness <= 10)),
  motivation integer check (motivation is null or (motivation >= 1 and motivation <= 10)),
  bodyweight numeric,
  sessions_completed integer,
  biggest_win text,
  biggest_struggle text,
  pain_niggles text,
  next_week_availability text,
  raw_answers jsonb,
  coach_response text,
  status text not null default 'submitted'
    check (status in ('due', 'submitted', 'reviewed'))
);

create index if not exists hyrox_check_ins_athlete_id_idx
  on public.hyrox_check_ins (athlete_id);

create index if not exists hyrox_check_ins_week_id_idx
  on public.hyrox_check_ins (programme_week_id);

create index if not exists hyrox_check_ins_status_idx
  on public.hyrox_check_ins (status);

-- ---------------------------------------------------------------------------
-- 11. hyrox_coach_notes
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_coach_notes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  note_type text not null
    check (note_type in (
      'profile_review',
      'programme_note',
      'check_in_response',
      'video_feedback',
      'race_prep',
      'general'
    )),
  title text,
  body text not null,
  visible_to_athlete boolean not null default false,
  related_programme_week_id uuid references public.hyrox_programme_weeks (id) on delete set null
);

create index if not exists hyrox_coach_notes_athlete_id_idx
  on public.hyrox_coach_notes (athlete_id);

create index if not exists hyrox_coach_notes_created_at_idx
  on public.hyrox_coach_notes (created_at desc);

-- ---------------------------------------------------------------------------
-- 12. hyrox_programme_status_history
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_programme_status_history (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  created_at timestamptz not null default now(),
  status_from text,
  status_to text not null,
  changed_by uuid references auth.users (id) on delete set null,
  reason text,
  metadata jsonb
);

create index if not exists hyrox_programme_status_history_athlete_id_idx
  on public.hyrox_programme_status_history (athlete_id);

create index if not exists hyrox_programme_status_history_created_at_idx
  on public.hyrox_programme_status_history (created_at desc);

-- ---------------------------------------------------------------------------
-- 13. hyrox_payments
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_payments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.hyrox_athletes (id) on delete set null,
  application_id uuid references public.hyrox_applications (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,
  payment_link_type text
    check (payment_link_type is null or payment_link_type in ('monthly', 'twelve_week', 'sixteen_week')),
  amount numeric,
  currency text not null default 'gbp',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  raw_event jsonb
);

create index if not exists hyrox_payments_athlete_id_idx
  on public.hyrox_payments (athlete_id);

create index if not exists hyrox_payments_application_id_idx
  on public.hyrox_payments (application_id);

create index if not exists hyrox_payments_status_idx
  on public.hyrox_payments (status);

create index if not exists hyrox_payments_stripe_checkout_idx
  on public.hyrox_payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ---------------------------------------------------------------------------
-- 14. hyrox_session_library
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_session_library (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  category text not null,
  subcategory text,
  level text,
  prescription jsonb not null default '{}'::jsonb,
  metadata jsonb,
  tags text[],
  is_staple boolean not null default false,
  is_active boolean not null default true,
  source text
);

create index if not exists hyrox_session_library_category_idx
  on public.hyrox_session_library (category);

create index if not exists hyrox_session_library_active_idx
  on public.hyrox_session_library (is_active)
  where is_active = true;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
  tables text[] := array[
    'hyrox_applications',
    'hyrox_athletes',
    'hyrox_assessments',
    'hyrox_testing_results',
    'hyrox_race_results',
    'hyrox_mapped_profiles',
    'hyrox_programme_drafts',
    'hyrox_programme_weeks',
    'hyrox_programme_sessions',
    'hyrox_check_ins',
    'hyrox_coach_notes',
    'hyrox_payments',
    'hyrox_session_library'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1
      from pg_trigger
      where tgname = t || '_set_updated_at'
        and tgrelid = ('public.' || t)::regclass
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
        t || '_set_updated_at',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security (Phase 1: enable + minimal policies; expand in Phase 2)
-- ---------------------------------------------------------------------------

alter table public.hyrox_applications enable row level security;
alter table public.hyrox_athletes enable row level security;
alter table public.hyrox_assessments enable row level security;
alter table public.hyrox_testing_results enable row level security;
alter table public.hyrox_race_results enable row level security;
alter table public.hyrox_mapped_profiles enable row level security;
alter table public.hyrox_programme_drafts enable row level security;
alter table public.hyrox_programme_weeks enable row level security;
alter table public.hyrox_programme_sessions enable row level security;
alter table public.hyrox_check_ins enable row level security;
alter table public.hyrox_coach_notes enable row level security;
alter table public.hyrox_programme_status_history enable row level security;
alter table public.hyrox_payments enable row level security;
alter table public.hyrox_session_library enable row level security;

-- Phase 1: allow anonymous/authenticated application submissions (rate-limit at API layer in Phase 3).
drop policy if exists hyrox_applications_insert_public on public.hyrox_applications;
create policy hyrox_applications_insert_public
  on public.hyrox_applications
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- TODO Phase 2 — enable after profiles.role + auth helpers exist
-- ---------------------------------------------------------------------------
--
-- Coach/admin: full access to all hyrox_* tables
--   using (public.is_hyrox_coach())
--   with check (public.is_hyrox_coach())
--
-- Athlete: read/update own hyrox_athletes row (user_id = auth.uid())
--
-- Athlete: read hyrox_assessments, hyrox_testing_results, hyrox_race_results where athlete_id = hyrox_athlete_id_for_user()
--
-- Athlete: read hyrox_programme_weeks / hyrox_programme_sessions where status = 'published' and own athlete_id
--   NEVER select from hyrox_programme_drafts
--
-- Athlete: read hyrox_mapped_profiles limited columns (optional summary only)
--
-- Athlete: insert/update own hyrox_check_ins
--
-- Athlete: read hyrox_coach_notes where visible_to_athlete = true
--
-- Service role (server): bypasses RLS — use for coach actions and webhooks until policies ship
