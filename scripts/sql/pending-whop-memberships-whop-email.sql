-- Additive: store Whop checkout email separately from normalized pending key.
alter table public.pending_whop_memberships
  add column if not exists whop_email text;

comment on column public.pending_whop_memberships.whop_email is
  'Email from Whop payload (data.user.email); used for claim matching alongside email.';
