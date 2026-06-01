-- Mirror of supabase/migrations/009_programme_instance_unlock.sql (manual apply if needed).

alter table public.programme_instances
  add column if not exists status text,
  add column if not exists unlock_at timestamptz,
  add column if not exists programme_generated_at timestamptz;

create index if not exists programme_instances_unlock_at_idx
  on public.programme_instances (unlock_at)
  where unlock_at is not null;
