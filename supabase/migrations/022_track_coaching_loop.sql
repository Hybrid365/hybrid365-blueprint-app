-- Track coaching loop records.
-- Does not duplicate benchmark, anchor, intake, profile, or assessment tables from 021.
-- Athletes submit evidence, session feedback, and weekly check-ins.
-- Derived anchors and adaptation provenance are not athlete-writable.
-- Applying this migration does not publish a programme and does not enable mutation.

create table if not exists public.track_programme_proposals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  readiness text not null,
  proposal jsonb not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint track_programme_proposals_published_check check (published = false)
);

comment on table public.track_programme_proposals is
  'Read-only generator output. published is constrained false until a future canary approval.';

create table if not exists public.track_calendar_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  programme_version integer not null default 1,
  session_date date not null,
  day_key text not null,
  title text not null,
  kind text not null,
  test_id text,
  instructions jsonb not null default '[]'::jsonb,
  status text not null default 'planned',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.track_session_feedback (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  session_id uuid not null references public.track_calendar_sessions (id) on delete cascade,
  completion text not null,
  rpe integer,
  feel text,
  pain boolean not null default false,
  actuals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint track_session_feedback_completion_check check (completion in ('completed', 'partial', 'modified', 'skipped')),
  constraint track_session_feedback_rpe_check check (rpe is null or (rpe between 1 and 10))
);

create table if not exists public.track_weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  week_of date not null,
  answers jsonb not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.track_adaptation_log (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  source text not null,
  decision text not null,
  snapshot jsonb not null,
  proposal jsonb not null,
  before_week jsonb not null,
  after_week jsonb not null,
  recorded_at timestamptz not null default now()
);

comment on table public.track_adaptation_log is
  'Append-only. Athletes cannot insert or edit provenance.';

create table if not exists public.track_escalations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.hyrox_athletes (id) on delete cascade,
  kind text not null,
  summary text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint track_escalations_kind_check check (
    kind in (
      'PAIN_REVIEW',
      'NO_SAFE_REFLOW',
      'REPEATED_FATIGUE',
      'PROGRAMME_CONFIGURATION_REQUIRED',
      'UNUSUAL_EXECUTION',
      'DATA_MISSING'
    )
  )
);

create table if not exists public.track_product_membership (
  athlete_id uuid primary key references public.hyrox_athletes (id) on delete cascade,
  status text not null default 'active',
  constraint track_product_membership_status_check check (status in ('active', 'paused', 'cancelled', 'expired'))
);

alter table public.track_programme_proposals enable row level security;
alter table public.track_calendar_sessions enable row level security;
alter table public.track_session_feedback enable row level security;
alter table public.track_weekly_checkins enable row level security;
alter table public.track_adaptation_log enable row level security;
alter table public.track_escalations enable row level security;
alter table public.track_product_membership enable row level security;

drop policy if exists track_programme_proposals_coach_all on public.track_programme_proposals;
create policy track_programme_proposals_coach_all on public.track_programme_proposals
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_calendar_sessions_coach_all on public.track_calendar_sessions;
create policy track_calendar_sessions_coach_all on public.track_calendar_sessions
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_session_feedback_coach_all on public.track_session_feedback;
create policy track_session_feedback_coach_all on public.track_session_feedback
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_weekly_checkins_coach_all on public.track_weekly_checkins;
create policy track_weekly_checkins_coach_all on public.track_weekly_checkins
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_adaptation_log_coach_all on public.track_adaptation_log;
create policy track_adaptation_log_coach_all on public.track_adaptation_log
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_escalations_coach_all on public.track_escalations;
create policy track_escalations_coach_all on public.track_escalations
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_product_membership_coach_all on public.track_product_membership;
create policy track_product_membership_coach_all on public.track_product_membership
  for all to authenticated using (public.is_hyrox_coach()) with check (public.is_hyrox_coach());

drop policy if exists track_programme_proposals_athlete_select on public.track_programme_proposals;
create policy track_programme_proposals_athlete_select on public.track_programme_proposals
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_calendar_sessions_athlete_select on public.track_calendar_sessions;
create policy track_calendar_sessions_athlete_select on public.track_calendar_sessions
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_session_feedback_athlete_select on public.track_session_feedback;
create policy track_session_feedback_athlete_select on public.track_session_feedback
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_session_feedback_athlete_insert on public.track_session_feedback;
create policy track_session_feedback_athlete_insert on public.track_session_feedback
  for insert to authenticated with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_weekly_checkins_athlete_select on public.track_weekly_checkins;
create policy track_weekly_checkins_athlete_select on public.track_weekly_checkins
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_weekly_checkins_athlete_insert on public.track_weekly_checkins;
create policy track_weekly_checkins_athlete_insert on public.track_weekly_checkins
  for insert to authenticated with check (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );

drop policy if exists track_product_membership_athlete_select on public.track_product_membership;
create policy track_product_membership_athlete_select on public.track_product_membership
  for select to authenticated using (
    exists (select 1 from public.hyrox_athletes ha where ha.id = athlete_id and ha.user_id = auth.uid())
  );
