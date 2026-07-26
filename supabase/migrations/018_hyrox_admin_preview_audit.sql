-- HYROX Team admin/coach athlete preview audit (additive).
-- Records preview start/end/page views — no session content.

create table if not exists public.hyrox_admin_preview_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  coach_user_id uuid not null references auth.users (id) on delete cascade,
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  event_type text not null
    check (event_type in ('preview_started', 'preview_ended', 'preview_page_view')),
  route text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists hyrox_admin_preview_events_coach_idx
  on public.hyrox_admin_preview_events (coach_user_id, created_at desc);

create index if not exists hyrox_admin_preview_events_athlete_idx
  on public.hyrox_admin_preview_events (athlete_id, created_at desc);

comment on table public.hyrox_admin_preview_events is
  'Audit log for HYROX Team admin/coach read-only athlete portal preview. No athlete mutation content.';

alter table public.hyrox_admin_preview_events enable row level security;

drop policy if exists hyrox_admin_preview_events_coach_select on public.hyrox_admin_preview_events;
create policy hyrox_admin_preview_events_coach_select
  on public.hyrox_admin_preview_events
  for select
  to authenticated
  using (public.is_hyrox_coach());

-- Inserts go through service-role coach server client after app-level auth.
drop policy if exists hyrox_admin_preview_events_coach_insert on public.hyrox_admin_preview_events;
create policy hyrox_admin_preview_events_coach_insert
  on public.hyrox_admin_preview_events
  for insert
  to authenticated
  with check (public.is_hyrox_coach() and coach_user_id = auth.uid());
