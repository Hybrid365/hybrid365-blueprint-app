-- Hybrid365 general 1-1 coaching applications (separate from hyrox_applications)
-- Apply via Supabase CLI or SQL editor before production use.

create table if not exists public.hybrid_1_1_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  full_name text not null,
  email text not null,
  phone text,
  instagram text,
  age integer,
  location text,
  occupation text,

  application_type text not null default 'hybrid_1_1'
    check (application_type = 'hybrid_1_1'),
  track text not null default 'hybrid_performance'
    check (track = 'hybrid_performance'),

  status text not null default 'new'
    check (status in ('new', 'reviewing', 'accepted', 'rejected', 'converted')),

  main_goal text,
  body_composition_goal text,
  performance_goal text,
  target_outcome text,
  reason_for_applying text,

  training_background jsonb not null default '{}'::jsonb,
  benchmarks jsonb not null default '{}'::jsonb,
  availability jsonb not null default '{}'::jsonb,
  nutrition_lifestyle jsonb not null default '{}'::jsonb,
  injuries_limitations jsonb not null default '{}'::jsonb,
  coaching_fit jsonb not null default '{}'::jsonb,
  consent jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,

  coach_notes text
);

create index if not exists hybrid_1_1_applications_status_idx
  on public.hybrid_1_1_applications (status);

create index if not exists hybrid_1_1_applications_created_at_idx
  on public.hybrid_1_1_applications (created_at desc);

create index if not exists hybrid_1_1_applications_email_idx
  on public.hybrid_1_1_applications (lower(email));

drop trigger if exists hybrid_1_1_applications_set_updated_at on public.hybrid_1_1_applications;
create trigger hybrid_1_1_applications_set_updated_at
  before update on public.hybrid_1_1_applications
  for each row
  execute function public.set_updated_at();

alter table public.hybrid_1_1_applications enable row level security;

-- Public insert (anon + authenticated) — same pattern as hyrox_applications
drop policy if exists hybrid_1_1_applications_insert_public on public.hybrid_1_1_applications;
create policy hybrid_1_1_applications_insert_public
  on public.hybrid_1_1_applications
  for insert
  to anon, authenticated
  with check (true);

-- Coach/admin read and update
drop policy if exists hybrid_1_1_applications_coach_all on public.hybrid_1_1_applications;
create policy hybrid_1_1_applications_coach_all
  on public.hybrid_1_1_applications
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

comment on table public.hybrid_1_1_applications is
  'General Hybrid365 1-1 coaching applications — not HYROX Team.';
