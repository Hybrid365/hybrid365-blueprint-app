-- Hybrid365: Whop → Supabase membership sync (additive only).
-- Run in Supabase SQL editor after review. Safe for existing manual rows (all new columns nullable).

alter table public.memberships
  add column if not exists source text,
  add column if not exists whop_membership_id text,
  add column if not exists whop_user_id text,
  add column if not exists whop_email text,
  add column if not exists whop_plan_id text,
  add column if not exists whop_product_id text,
  add column if not exists last_whop_event_id text,
  add column if not exists last_whop_event_type text,
  add column if not exists last_whop_event_at timestamptz;

comment on column public.memberships.whop_membership_id is 'Whop membership id from webhooks (idempotency / support).';
comment on column public.memberships.last_whop_event_id is 'Standard Webhooks webhook-id header; skip duplicate deliveries.';

-- Webhook upsert uses onConflict: "user_id". Ensure `user_id` is UNIQUE (or primary) in your DB before enabling Whop.
