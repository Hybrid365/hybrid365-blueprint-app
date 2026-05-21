-- Hybrid365 Hyrox Team — Phase 2: profiles.role + RLS helpers + policies
-- Requires: 001_hyrox_team_schema.sql applied first.
-- Requires: public.profiles table (existing Hybrid365 Supabase project).

-- ---------------------------------------------------------------------------
-- profiles.role (smallest safe role model)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    raise exception
      'public.profiles does not exist. Create the standard Supabase profiles table before applying 002_hyrox_roles_and_rls.sql.';
  end if;

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

    comment on column public.profiles.role is
      'App role: member (default dashboard), athlete (Hyrox portal), coach/admin (Hyrox coach dashboard).';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS helpers (security definer — read profiles / hyrox_athletes for auth.uid())
-- ---------------------------------------------------------------------------

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

create or replace function public.hyrox_athlete_id_for_user()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select a.id
  from public.hyrox_athletes a
  where a.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_hyrox_athlete()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.hyrox_athlete_id_for_user() is not null
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'athlete'
    );
$$;

grant execute on function public.is_hyrox_coach() to authenticated;
grant execute on function public.hyrox_athlete_id_for_user() to authenticated;
grant execute on function public.is_hyrox_athlete() to authenticated;

-- ---------------------------------------------------------------------------
-- hyrox_applications — public insert; coach manages
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_applications_coach_all on public.hyrox_applications;
create policy hyrox_applications_coach_all
  on public.hyrox_applications
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

-- ---------------------------------------------------------------------------
-- hyrox_athletes
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_athletes_coach_all on public.hyrox_athletes;
create policy hyrox_athletes_coach_all
  on public.hyrox_athletes
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_athletes_self_select on public.hyrox_athletes;
create policy hyrox_athletes_self_select
  on public.hyrox_athletes
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists hyrox_athletes_self_update on public.hyrox_athletes;
create policy hyrox_athletes_self_update
  on public.hyrox_athletes
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Athlete-owned child tables (coach all + athlete own)
-- ---------------------------------------------------------------------------

-- Macro: assessments, testing, race, mapped profiles, check-ins, status history
do $$
declare
  t text;
  tables text[] := array[
    'hyrox_assessments',
    'hyrox_testing_results',
    'hyrox_race_results',
    'hyrox_mapped_profiles',
    'hyrox_check_ins',
    'hyrox_programme_status_history'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_coach_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach())',
      t || '_coach_all',
      t
    );
    execute format('drop policy if exists %I on public.%I', t || '_athlete_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (athlete_id = public.hyrox_athlete_id_for_user())',
      t || '_athlete_select',
      t
    );
    if t in ('hyrox_assessments', 'hyrox_testing_results', 'hyrox_race_results', 'hyrox_check_ins') then
      execute format('drop policy if exists %I on public.%I', t || '_athlete_insert', t);
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (athlete_id = public.hyrox_athlete_id_for_user())',
        t || '_athlete_insert',
        t
      );
      execute format('drop policy if exists %I on public.%I', t || '_athlete_update', t);
      execute format(
        'create policy %I on public.%I for update to authenticated using (athlete_id = public.hyrox_athlete_id_for_user()) with check (athlete_id = public.hyrox_athlete_id_for_user())',
        t || '_athlete_update',
        t
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- hyrox_programme_drafts — coach ONLY (no athlete policies)
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_programme_drafts_coach_all on public.hyrox_programme_drafts;
create policy hyrox_programme_drafts_coach_all
  on public.hyrox_programme_drafts
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

-- ---------------------------------------------------------------------------
-- hyrox_programme_weeks — coach all; athlete published only
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_programme_weeks_coach_all on public.hyrox_programme_weeks;
create policy hyrox_programme_weeks_coach_all
  on public.hyrox_programme_weeks
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_programme_weeks_athlete_select on public.hyrox_programme_weeks;
create policy hyrox_programme_weeks_athlete_select
  on public.hyrox_programme_weeks
  for select
  to authenticated
  using (
    athlete_id = public.hyrox_athlete_id_for_user()
    and status = 'published'
  );

-- ---------------------------------------------------------------------------
-- hyrox_programme_sessions — coach all; athlete via published week
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_programme_sessions_coach_all on public.hyrox_programme_sessions;
create policy hyrox_programme_sessions_coach_all
  on public.hyrox_programme_sessions
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_programme_sessions_athlete_select on public.hyrox_programme_sessions;
create policy hyrox_programme_sessions_athlete_select
  on public.hyrox_programme_sessions
  for select
  to authenticated
  using (
    athlete_id = public.hyrox_athlete_id_for_user()
    and exists (
      select 1
      from public.hyrox_programme_weeks w
      where w.id = programme_week_id
        and w.status = 'published'
    )
  );

drop policy if exists hyrox_programme_sessions_athlete_update on public.hyrox_programme_sessions;
create policy hyrox_programme_sessions_athlete_update
  on public.hyrox_programme_sessions
  for update
  to authenticated
  using (athlete_id = public.hyrox_athlete_id_for_user())
  with check (athlete_id = public.hyrox_athlete_id_for_user());

-- ---------------------------------------------------------------------------
-- hyrox_coach_notes
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_coach_notes_coach_all on public.hyrox_coach_notes;
create policy hyrox_coach_notes_coach_all
  on public.hyrox_coach_notes
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_coach_notes_athlete_select on public.hyrox_coach_notes;
create policy hyrox_coach_notes_athlete_select
  on public.hyrox_coach_notes
  for select
  to authenticated
  using (
    athlete_id = public.hyrox_athlete_id_for_user()
    and visible_to_athlete = true
  );

-- ---------------------------------------------------------------------------
-- hyrox_payments — coach all; athlete read own
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_payments_coach_all on public.hyrox_payments;
create policy hyrox_payments_coach_all
  on public.hyrox_payments
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());

drop policy if exists hyrox_payments_athlete_select on public.hyrox_payments;
create policy hyrox_payments_athlete_select
  on public.hyrox_payments
  for select
  to authenticated
  using (athlete_id = public.hyrox_athlete_id_for_user());

-- ---------------------------------------------------------------------------
-- hyrox_session_library — coach only
-- ---------------------------------------------------------------------------

drop policy if exists hyrox_session_library_coach_all on public.hyrox_session_library;
create policy hyrox_session_library_coach_all
  on public.hyrox_session_library
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());
