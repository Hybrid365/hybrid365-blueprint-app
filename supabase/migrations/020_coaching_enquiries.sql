-- Talk to Kieran coaching enquiries.
-- Separate from hyrox_applications and hybrid_1_1_applications.
-- Apply via Supabase SQL editor (or CLI) before production use. Do not auto-apply.
-- Numbered 020 because 019 is already used by BoxCross (019_boxcross_ski_challenge.sql).

create table if not exists public.coaching_enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  first_name text not null,
  instagram_handle text not null,
  goal text not null,

  email text,
  current_hyrox_pb text,
  next_race text,

  source text,
  attribution jsonb,

  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'closed'))
);

create index if not exists coaching_enquiries_created_at_idx
  on public.coaching_enquiries (created_at desc);

create index if not exists coaching_enquiries_status_idx
  on public.coaching_enquiries (status);

create index if not exists coaching_enquiries_email_idx
  on public.coaching_enquiries (lower(email))
  where email is not null;

create index if not exists coaching_enquiries_instagram_idx
  on public.coaching_enquiries (lower(instagram_handle));

comment on table public.coaching_enquiries is
  'Talk to Kieran warm leads from /start/talk. Not HYROX Team applications.';

comment on column public.coaching_enquiries.instagram_handle is
  'Normalised handle stored as @username.';

comment on column public.coaching_enquiries.status is
  'Lead lifecycle: new → contacted → qualified → converted / closed.';

comment on column public.coaching_enquiries.attribution is
  'Optional UTM / landing path JSON. Submission works when empty.';

alter table public.coaching_enquiries enable row level security;

revoke all on table public.coaching_enquiries from public;

grant insert on table public.coaching_enquiries to anon, authenticated;
grant select, update, delete on table public.coaching_enquiries to authenticated;

drop policy if exists coaching_enquiries_insert_public on public.coaching_enquiries;
create policy coaching_enquiries_insert_public
  on public.coaching_enquiries
  for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists coaching_enquiries_coach_all on public.coaching_enquiries;
create policy coaching_enquiries_coach_all
  on public.coaching_enquiries
  for all
  to authenticated
  using (public.is_hyrox_coach())
  with check (public.is_hyrox_coach());
