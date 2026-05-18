-- Hybrid365: pending Whop access for emails not yet in auth.users.
-- Run in Supabase SQL editor after review.

create table if not exists public.pending_whop_memberships (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  whop_email text,
  status text not null check (status in ('active', 'inactive')),
  expires_at timestamptz,
  whop_membership_id text,
  whop_user_id text,
  whop_plan_id text,
  whop_product_id text,
  last_whop_event_id text,
  last_whop_event_type text,
  last_whop_event_at timestamptz,
  claimed_at timestamptz,
  claimed_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_whop_memberships_email_unique unique (email)
);

create unique index if not exists pending_whop_memberships_last_whop_event_id_key
  on public.pending_whop_memberships (last_whop_event_id)
  where last_whop_event_id is not null;

create index if not exists pending_whop_memberships_unclaimed_email_idx
  on public.pending_whop_memberships (email)
  where claimed_at is null;

comment on table public.pending_whop_memberships is
  'Whop webhook rows held until the buyer signs into Supabase Auth with the same email.';

alter table public.pending_whop_memberships enable row level security;

-- Service role (webhook + server claim) bypasses RLS; no authenticated policies by design.
