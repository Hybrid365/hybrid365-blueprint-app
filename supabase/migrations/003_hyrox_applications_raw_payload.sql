-- Phase 3: store unmapped apply-form fields on applications.

alter table public.hyrox_applications
  add column if not exists raw_payload jsonb not null default '{}'::jsonb;

comment on column public.hyrox_applications.raw_payload is
  'Extra fields from /hyrox-team/apply not mapped to dedicated columns.';
