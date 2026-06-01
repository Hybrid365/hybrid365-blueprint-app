-- Paid community programme unlock delay (coach-built experience).
-- Legacy rows: status and unlock_at null → treated as live when weeks exist.

alter table public.programme_instances
  add column if not exists status text,
  add column if not exists unlock_at timestamptz,
  add column if not exists programme_generated_at timestamptz;

comment on column public.programme_instances.status is
  'Community programme visibility: pending_unlock | live. Null = legacy (live when weeks exist).';

comment on column public.programme_instances.unlock_at is
  'When the member can view generated programme_weeks on the dashboard.';

comment on column public.programme_instances.programme_generated_at is
  'When programme_weeks were last generated (Kit / email hooks).';

create index if not exists programme_instances_unlock_at_idx
  on public.programme_instances (unlock_at)
  where unlock_at is not null;
