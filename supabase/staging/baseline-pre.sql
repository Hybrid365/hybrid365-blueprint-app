-- Hybrid365 staging baseline (pre: before migration 001). Generated from production pg_catalog; structure only, no rows.
-- Staging only. Never apply to production. Regenerate with scripts/staging/dump-production-schema.mjs.
-- Server 17.6. Base tables: athlete_assessments, benchmark_tests, challenge_submissions, daily_habit_logs, memberships, pending_whop_memberships, profiles, programme_instances, programme_weeks, weekly_check_ins.

set check_function_bodies = off;

create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;

do $$ begin
  create type public.membership_status as enum ('active', 'inactive', 'trialing');
exception when duplicate_object then null;
end $$;

create table if not exists public.athlete_assessments (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  programme_instance_id uuid,
  goal_focus text,
  event_type text,
  event_date date,
  target_time text,
  training_days_per_week integer,
  weekly_hours_band text,
  preferred_training_days text[],
  double_session_days text[],
  current_running_volume_km numeric(5,1),
  longest_recent_run_km numeric(5,1),
  recent_5k_time text,
  recent_10k_time text,
  hyrox_pb text,
  bodyweight_kg numeric(5,2),
  target_bodyweight_kg numeric(5,2),
  strength_experience text,
  hyrox_experience text,
  equipment text[],
  injury_flags text[],
  movements_to_avoid text[],
  biggest_limiter text,
  notes text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  first_name text,
  age integer,
  height_cm numeric(5,2),
  current_run_volume_band text,
  max_heart_rate integer,
  training_track text default 'hybrid_performance'::text not null,
  hyrox_details jsonb default '{}'::jsonb not null,
  constraint athlete_assessments_age_check CHECK (age >= 13 AND age <= 100),
  constraint athlete_assessments_training_days_per_week_check CHECK (training_days_per_week >= 2 AND training_days_per_week <= 7),
  constraint athlete_assessments_pkey PRIMARY KEY (id),
  constraint athlete_assessments_user_id_key UNIQUE (user_id)
);

create table if not exists public.benchmark_tests (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  programme_instance_id uuid,
  test_type text not null,
  test_label text not null,
  test_value numeric(8,2),
  test_unit text,
  test_time text,
  bodyweight_kg numeric(5,2),
  week_number integer,
  test_phase text default 'baseline'::text,
  notes text,
  tested_at date default CURRENT_DATE not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint benchmark_tests_week_number_check CHECK (week_number >= 0 AND week_number <= 12),
  constraint benchmark_tests_pkey PRIMARY KEY (id)
);

create table if not exists public.challenge_submissions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  programme_instance_id uuid,
  challenge_key text not null,
  challenge_week integer not null,
  challenge_title text not null,
  score_value numeric(10,2),
  score_unit text,
  score_time text,
  proof_url text,
  proof_note text,
  status text default 'pending'::text not null,
  points_awarded integer default 0 not null,
  admin_notes text,
  submitted_at timestamp with time zone default now() not null,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint challenge_submissions_challenge_week_check CHECK (challenge_week >= 1 AND challenge_week <= 6),
  constraint challenge_submissions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  constraint challenge_submissions_pkey PRIMARY KEY (id),
  constraint challenge_submissions_user_id_challenge_week_challenge_key_key UNIQUE (user_id, challenge_week, challenge_key)
);

create table if not exists public.daily_habit_logs (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  programme_instance_id uuid,
  log_date date default CURRENT_DATE not null,
  water_hit boolean default false not null,
  protein_hit boolean default false not null,
  steps_hit boolean default false not null,
  sleep_hit boolean default false not null,
  mobility_hit boolean default false not null,
  proof_posted boolean default false not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint daily_habit_logs_pkey PRIMARY KEY (id),
  constraint daily_habit_logs_user_id_log_date_key UNIQUE (user_id, log_date)
);

create table if not exists public.memberships (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  status membership_status default 'inactive'::membership_status not null,
  source text default 'manual'::text not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  whop_membership_id text,
  whop_user_id text,
  whop_email text,
  whop_plan_id text,
  whop_product_id text,
  last_whop_event_id text,
  last_whop_event_type text,
  last_whop_event_at timestamp with time zone,
  access_started_at timestamp with time zone,
  constraint memberships_pkey PRIMARY KEY (id),
  constraint memberships_user_id_key UNIQUE (user_id)
);

create table if not exists public.pending_whop_memberships (
  id uuid default gen_random_uuid() not null,
  email text not null,
  status text not null,
  expires_at timestamp with time zone,
  whop_membership_id text,
  whop_user_id text,
  whop_plan_id text,
  whop_product_id text,
  last_whop_event_id text,
  last_whop_event_type text,
  last_whop_event_at timestamp with time zone,
  claimed_at timestamp with time zone,
  claimed_user_id uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  source text default 'whop'::text,
  whop_email text,
  constraint pending_whop_memberships_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  constraint pending_whop_memberships_pkey PRIMARY KEY (id),
  constraint pending_whop_memberships_email_unique UNIQUE (email)
);

create table if not exists public.profiles (
  id uuid not null,
  full_name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  role text default 'member'::text,
  constraint profiles_role_check CHECK (role = ANY (ARRAY['member'::text, 'athlete'::text, 'coach'::text, 'admin'::text])),
  constraint profiles_pkey PRIMARY KEY (id)
);

create table if not exists public.programme_instances (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  title text default 'Hybrid365 Programme'::text not null,
  created_at timestamp with time zone default now() not null,
  onboarding_inputs jsonb,
  goal_focus text,
  ability_level text,
  weekly_hours_band text,
  start_date date,
  current_week integer default 1 not null,
  status text,
  unlock_at timestamp with time zone,
  programme_generated_at timestamp with time zone,
  constraint programme_instances_pkey PRIMARY KEY (id),
  constraint programme_instances_user_id_key UNIQUE (user_id)
);

create table if not exists public.programme_weeks (
  id uuid default gen_random_uuid() not null,
  programme_instance_id uuid not null,
  week_number integer not null,
  title text default 'Week'::text not null,
  is_unlocked boolean default false not null,
  plan_json jsonb,
  created_at timestamp with time zone default now() not null,
  constraint programme_weeks_week_number_check CHECK (week_number >= 1 AND week_number <= 12),
  constraint programme_weeks_pkey PRIMARY KEY (id),
  constraint programme_weeks_programme_instance_id_week_number_key UNIQUE (programme_instance_id, week_number)
);

create table if not exists public.weekly_check_ins (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  programme_instance_id uuid not null,
  week_number integer not null,
  bodyweight_kg numeric(5,2),
  sleep_hours numeric(3,1),
  energy_score integer,
  recovery_score integer,
  stress_score integer,
  motivation_score integer,
  adherence_score integer,
  biggest_win text,
  biggest_struggle text,
  pain_or_injury text,
  notes text,
  submitted_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  hyrox_checkin_details jsonb default '{}'::jsonb not null,
  constraint weekly_check_ins_adherence_score_check CHECK (adherence_score >= 0 AND adherence_score <= 100),
  constraint weekly_check_ins_energy_score_check CHECK (energy_score >= 1 AND energy_score <= 10),
  constraint weekly_check_ins_motivation_score_check CHECK (motivation_score >= 1 AND motivation_score <= 10),
  constraint weekly_check_ins_recovery_score_check CHECK (recovery_score >= 1 AND recovery_score <= 10),
  constraint weekly_check_ins_stress_score_check CHECK (stress_score >= 1 AND stress_score <= 10),
  constraint weekly_check_ins_week_number_check CHECK (week_number >= 1 AND week_number <= 12),
  constraint weekly_check_ins_pkey PRIMARY KEY (id),
  constraint weekly_check_ins_user_id_programme_instance_id_week_number_key UNIQUE (user_id, programme_instance_id, week_number)
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  insert into public.memberships (user_id, status)
  values (new.id, 'inactive')
  on conflict (user_id) do nothing;

  return new;
end $function$;

