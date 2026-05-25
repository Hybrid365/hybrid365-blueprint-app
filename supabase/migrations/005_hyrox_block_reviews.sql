-- Hyrox coach block reviews (end of block 1/2/3 — weeks 4, 8, 12)
-- Idempotent: safe to re-run in Supabase SQL editor after a partial apply.
--
-- Coach RLS uses public.is_hyrox_coach() (same as 002_hyrox_roles_and_rls.sql).
-- If 002 was never applied, this migration creates that helper before policies.

-- ---------------------------------------------------------------------------
-- Coach RLS helper (from 002 — create or replace so 005 can run standalone)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'profiles'
        and column_name = 'role'
    ) then
      alter table public.profiles
        add column role text not null default 'member'
        constraint profiles_role_check
          check (role in ('member', 'athlete', 'coach', 'admin'));
    end if;
  end if;
end $$;

create or replace function public.is_hyrox_coach()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('coach', 'admin')
  );
$$;

grant execute on function public.is_hyrox_coach() to authenticated;

-- ---------------------------------------------------------------------------
-- hyrox_block_reviews
-- ---------------------------------------------------------------------------

create table if not exists public.hyrox_block_reviews (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  block_number integer not null,
  weeks_start integer not null,
  weeks_end integer not null,
  completion_summary jsonb not null default '{}'::jsonb,
  coach_notes jsonb not null default '{}'::jsonb,
  next_block_recommendation text,
  next_block_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hyrox_block_reviews_block_number_check check (block_number >= 1 and block_number <= 4),
  constraint hyrox_block_reviews_weeks_check check (weeks_end >= weeks_start and weeks_start >= 1),
  constraint hyrox_block_reviews_athlete_block_unique unique (athlete_id, block_number)
);

create index if not exists hyrox_block_reviews_athlete_id_idx
  on public.hyrox_block_reviews (athlete_id);

create index if not exists hyrox_block_reviews_athlete_block_idx
  on public.hyrox_block_reviews (athlete_id, block_number);

comment on table public.hyrox_block_reviews is
  'Coach block review at end of each 4-week Hyrox programme block (weeks 4, 8, 12).';

alter table public.hyrox_block_reviews enable row level security;

drop policy if exists hyrox_block_reviews_coach_all on public.hyrox_block_reviews;
create policy hyrox_block_reviews_coach_all
  on public.hyrox_block_reviews
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());
