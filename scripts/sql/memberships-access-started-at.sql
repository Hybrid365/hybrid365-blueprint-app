-- Hybrid365: membership access window for month-based programme week unlocks.
-- Run in Supabase SQL editor after review.

alter table public.memberships
  add column if not exists access_started_at timestamptz;

comment on column public.memberships.access_started_at is
  'When paid Whop access began; used for month 1–3 week unlock (4 / 8 / 12 weeks). Set on first activation webhook or claim.';

-- Optional backfill for existing active rows (uses row creation time if you have created_at):
-- update public.memberships
-- set access_started_at = coalesce(access_started_at, created_at, updated_at, now())
-- where status = 'active' and access_started_at is null;
