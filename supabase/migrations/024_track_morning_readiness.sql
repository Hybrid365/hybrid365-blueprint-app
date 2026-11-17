-- Morning readiness for the Track athlete.
-- Append-only. Staging canary persistence. Does not enable production mutation.

create table if not exists public.track_morning_readiness (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  local_date date not null,
  answers jsonb not null,
  interpretation text not null,
  created_at timestamptz not null default now()
);

create index if not exists track_morning_readiness_athlete_date_idx
  on public.track_morning_readiness (athlete_id, local_date, created_at desc);

alter table public.track_morning_readiness enable row level security;

drop policy if exists track_morning_readiness_coach_all on public.track_morning_readiness;
create policy track_morning_readiness_coach_all on public.track_morning_readiness
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_morning_readiness_athlete_select on public.track_morning_readiness;
create policy track_morning_readiness_athlete_select on public.track_morning_readiness
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_morning_readiness_athlete_insert on public.track_morning_readiness;
create policy track_morning_readiness_athlete_insert on public.track_morning_readiness
  for insert to authenticated with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop trigger if exists track_morning_readiness_append_only on public.track_morning_readiness;
create trigger track_morning_readiness_append_only
  before update or delete on public.track_morning_readiness
  for each row execute function public.track_reject_mutation();
