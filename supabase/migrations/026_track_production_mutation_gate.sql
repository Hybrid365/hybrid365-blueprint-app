-- Production mutation gate.
-- The existing functions stay as the implementation. The public names fail closed
-- unless this transaction was explicitly enabled by the approved server path.
-- Applying this file does not enable mutation.

create or replace function public.track_assert_mutation_allowed(athlete uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  product_status text;
  gate text;
begin
  if athlete is distinct from '97919cf6-6574-4ec1-8532-7a295b3e52ee'::uuid then
    raise exception 'TRACK_MUTATION_DISABLED';
  end if;

  select status into product_status
  from public.track_product_membership
  where athlete_id = athlete;
  if product_status is distinct from 'active' then
    raise exception 'TRACK_MUTATION_DISABLED';
  end if;

  gate := current_setting('track.programme_mutation', true);
  if gate is distinct from 'enabled' then
    raise exception 'TRACK_MUTATION_DISABLED';
  end if;
end;
$$;

revoke all on function public.track_assert_mutation_allowed(uuid) from public, anon, authenticated, service_role;

alter function public.track_accept_reflow(jsonb) rename to track_accept_reflow_impl;
alter function public.track_decline_reflow(jsonb) rename to track_decline_reflow_impl;
alter function public.track_accept_next_week(jsonb) rename to track_accept_next_week_impl;
alter function public.track_open_scheduled_week(jsonb) rename to track_open_scheduled_week_impl;

revoke all on function public.track_accept_reflow_impl(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.track_decline_reflow_impl(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.track_accept_next_week_impl(jsonb) from public, anon, authenticated, service_role;
revoke all on function public.track_open_scheduled_week_impl(jsonb) from public, anon, authenticated, service_role;

create or replace function public.track_accept_reflow(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.track_assert_mutation_allowed((payload->>'athlete_id')::uuid);
  return public.track_accept_reflow_impl(payload);
end;
$$;

create or replace function public.track_decline_reflow(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.track_assert_mutation_allowed((payload->>'athlete_id')::uuid);
  return public.track_decline_reflow_impl(payload);
end;
$$;

create or replace function public.track_accept_next_week(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.track_assert_mutation_allowed((payload->>'athlete_id')::uuid);
  return public.track_accept_next_week_impl(payload);
end;
$$;

create or replace function public.track_open_scheduled_week(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.track_assert_mutation_allowed((payload->>'athlete_id')::uuid);
  return public.track_open_scheduled_week_impl(payload);
end;
$$;

revoke all on function public.track_accept_reflow(jsonb) from public, anon, authenticated;
revoke all on function public.track_decline_reflow(jsonb) from public, anon, authenticated;
revoke all on function public.track_accept_next_week(jsonb) from public, anon, authenticated;
revoke all on function public.track_open_scheduled_week(jsonb) from public, anon, authenticated;

grant execute on function public.track_accept_reflow(jsonb) to service_role;
grant execute on function public.track_decline_reflow(jsonb) to service_role;
grant execute on function public.track_accept_next_week(jsonb) to service_role;
grant execute on function public.track_open_scheduled_week(jsonb) to service_role;

comment on function public.track_assert_mutation_allowed(uuid) is
  'Fail closed. Programme mutation requires the approved server gate in this transaction, the canary athlete, and an active Track membership.';
