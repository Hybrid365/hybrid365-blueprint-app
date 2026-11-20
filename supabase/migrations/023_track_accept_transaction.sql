-- Staging accept transaction for one Track week.
-- Does not duplicate 021 foundation tables or 022 loop tables.
-- published stays false. Production callers are not granted execute.
-- Athletes cannot update provenance, check-ins, or this function.

alter table public.track_programme_proposals
  add column if not exists status text not null default 'proposed',
  add column if not exists week_revision integer not null default 1,
  add column if not exists fingerprint text;

alter table public.track_programme_proposals
  drop constraint if exists track_programme_proposals_status_check;

alter table public.track_programme_proposals
  add constraint track_programme_proposals_status_check
  check (status in ('proposed', 'accepted', 'declined'));

alter table public.track_calendar_sessions
  add column if not exists active boolean not null default true;

create unique index if not exists track_calendar_active_day_idx
  on public.track_calendar_sessions (athlete_id, day_key)
  where active;

alter table public.track_adaptation_log
  add column if not exists product text,
  add column if not exists operations jsonb,
  add column if not exists before_revision integer,
  add column if not exists after_revision integer,
  add column if not exists workload_before jsonb,
  add column if not exists workload_after jsonb,
  add column if not exists reason_codes jsonb,
  add column if not exists policy_version text,
  add column if not exists accepted_at timestamptz;

create or replace function public.track_reject_mutation()
returns trigger
language plpgsql
as $$
begin
  if current_setting('track.maintenance', true) = 'on' and tg_op = 'DELETE' then
    return old;
  end if;
  raise exception 'APPEND_ONLY';
end;
$$;

drop trigger if exists track_adaptation_log_append_only on public.track_adaptation_log;
create trigger track_adaptation_log_append_only
  before update or delete on public.track_adaptation_log
  for each row execute function public.track_reject_mutation();

drop trigger if exists track_weekly_checkins_append_only on public.track_weekly_checkins;
create trigger track_weekly_checkins_append_only
  before update or delete on public.track_weekly_checkins
  for each row execute function public.track_reject_mutation();

create or replace function public.track_accept_reflow(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete uuid := (payload->>'athlete_id')::uuid;
  proposal_id uuid := (payload->>'proposal_id')::uuid;
  expected_revision integer := (payload->>'expected_revision')::integer;
  policy_version text := coalesce(payload->>'policy_version', 'track-loop-v1');
  failpoint text := payload->>'failpoint';
  ops jsonb := coalesce(payload->'operations', '[]'::jsonb);
  snapshot jsonb := coalesce(payload->'snapshot', '{}'::jsonb);
  workload_before jsonb := coalesce(payload->'workload_before', '{}'::jsonb);
  workload_after jsonb := coalesce(payload->'workload_after', '{}'::jsonb);
  reason_codes jsonb := coalesce(payload->'reason_codes', '[]'::jsonb);
  op jsonb;
  proposal_status text;
  proposal_revision integer;
  proposal_fingerprint text;
  product_status text;
  current_revision integer;
  after_rows jsonb := '[]'::jsonb;
  before_week jsonb := '[]'::jsonb;
  new_revision integer;
  target_status text;
begin
  if coalesce(payload->>'allow_production', 'false') = 'true' then
    raise exception 'TRACK_WRITE_BLOCKED';
  end if;
  if jsonb_array_length(ops) = 0 then
    raise exception 'NO_OPERATIONS';
  end if;

  perform pg_advisory_xact_lock(hashtext(athlete::text));

  select status into product_status
  from public.track_product_membership
  where athlete_id = athlete;
  if product_status is distinct from 'active' then
    raise exception 'PRODUCT_INACTIVE';
  end if;

  select status, week_revision, fingerprint
    into proposal_status, proposal_revision, proposal_fingerprint
  from public.track_programme_proposals
  where id = proposal_id and athlete_id = athlete
  for update;

  if proposal_status is null then
    raise exception 'PROPOSAL_MISSING';
  end if;
  if proposal_status = 'accepted' then
    raise exception 'ALREADY_ACCEPTED';
  end if;
  if proposal_status <> 'proposed' then
    raise exception 'PROPOSAL_NOT_CURRENT';
  end if;
  if proposal_revision is distinct from expected_revision then
    raise exception 'STALE_RECOMMENDATION';
  end if;

  if exists (
    select 1
    from public.track_adaptation_log log
    where log.athlete_id = athlete
      and log.decision = 'declined'
      and log.proposal->>'fingerprint' = proposal_fingerprint
      and (log.proposal->>'week_revision')::integer = expected_revision
  ) then
    raise exception 'SUPPRESSED';
  end if;

  select coalesce(max(programme_version), 0)
    into current_revision
  from public.track_calendar_sessions
  where athlete_id = athlete and active;

  if current_revision is distinct from expected_revision then
    raise exception 'STALE_RECOMMENDATION';
  end if;

  select coalesce(jsonb_agg(to_jsonb(session) order by session.day_key), '[]'::jsonb)
    into before_week
  from public.track_calendar_sessions session
  where session.athlete_id = athlete and session.active;

  select coalesce(jsonb_agg(jsonb_build_object(
    'lineage_id', session.id,
    'day_key', session.day_key,
    'title', session.title,
    'status', session.status,
    'session_date', session.session_date,
    'kind', session.kind,
    'payload', session.payload,
    'test_id', session.test_id
  ) order by session.day_key), '[]'::jsonb)
    into after_rows
  from public.track_calendar_sessions session
  where session.athlete_id = athlete and session.active;

  for op in select value from jsonb_array_elements(ops)
  loop
    if op->>'op' = 'insert' then
      after_rows := after_rows || jsonb_build_array(jsonb_build_object(
        'lineage_id', gen_random_uuid(),
        'day_key', op->>'day_key',
        'title', op->>'title',
        'status', 'planned',
        'session_date', op->>'session_date',
        'kind', coalesce(op->>'kind', 'training'),
        'payload', coalesce(op->'payload', '{}'::jsonb),
        'test_id', null
      ));
      continue;
    end if;

    select status into target_status
    from public.track_calendar_sessions
    where id = (op->>'session_id')::uuid
      and athlete_id = athlete
      and active;
    if target_status is null then
      raise exception 'SESSION_MISSING';
    end if;
    if target_status <> 'planned' then
      raise exception 'COMPLETED_SESSION';
    end if;

    if op->>'op' = 'move' then
      select coalesce(jsonb_agg(
        case
          when item->>'lineage_id' = op->>'session_id'
            then item || jsonb_build_object('day_key', op->>'to_day', 'session_date', coalesce(op->>'session_date', item->>'session_date'))
          else item
        end
      ), '[]'::jsonb)
        into after_rows
      from jsonb_array_elements(after_rows) item;
    elsif op->>'op' = 'replace' then
      select coalesce(jsonb_agg(
        case
          when item->>'lineage_id' = op->>'session_id'
            then item || jsonb_build_object('title', op->>'title', 'payload', coalesce(op->'payload', item->'payload'))
          else item
        end
      ), '[]'::jsonb)
        into after_rows
      from jsonb_array_elements(after_rows) item;
    elsif op->>'op' = 'remove' then
      select coalesce(jsonb_agg(item), '[]'::jsonb)
        into after_rows
      from jsonb_array_elements(after_rows) item
      where item->>'lineage_id' is distinct from op->>'session_id';
    else
      raise exception 'UNSUPPORTED_OPERATION';
    end if;
  end loop;

  if exists (
    select 1
    from (
      select item->>'day_key' as day_key
      from jsonb_array_elements(after_rows) item
      group by 1
      having count(*) > 1
    ) duplicated
  ) then
    raise exception 'DUPLICATE_SESSION';
  end if;

  update public.track_calendar_sessions
  set active = false
  where athlete_id = athlete and active;

  if failpoint = 'after_version' then
    raise exception 'INJECTED_FAILURE';
  end if;

  new_revision := expected_revision + 1;

  if failpoint = 'after_first_operation' then
    insert into public.track_calendar_sessions (
      athlete_id, programme_version, session_date, day_key, title, kind, status, payload, active
    )
    select
      athlete,
      new_revision,
      (item->>'session_date')::date,
      item->>'day_key',
      item->>'title',
      item->>'kind',
      item->>'status',
      coalesce(item->'payload', '{}'::jsonb),
      true
    from jsonb_array_elements(after_rows) item
    limit 1;
    raise exception 'INJECTED_FAILURE';
  end if;

  insert into public.track_calendar_sessions (
    athlete_id, programme_version, session_date, day_key, title, kind, test_id, status, payload, active
  )
  select
    athlete,
    new_revision,
    (item->>'session_date')::date,
    item->>'day_key',
    item->>'title',
    item->>'kind',
    nullif(item->>'test_id', ''),
    item->>'status',
    coalesce(item->'payload', '{}'::jsonb) || jsonb_build_object('lineage_id', item->>'lineage_id'),
    true
  from jsonb_array_elements(after_rows) item;

  if failpoint = 'before_provenance' then
    raise exception 'INJECTED_FAILURE';
  end if;

  insert into public.track_adaptation_log (
    athlete_id, source, decision, snapshot, proposal, before_week, after_week,
    product, operations, before_revision, after_revision, workload_before, workload_after,
    reason_codes, policy_version, accepted_at
  ) values (
    athlete,
    'daily_readiness',
    'accepted',
    snapshot,
    jsonb_build_object('id', proposal_id, 'fingerprint', proposal_fingerprint, 'week_revision', expected_revision),
    before_week,
    after_rows,
    'track',
    ops,
    expected_revision,
    new_revision,
    workload_before,
    workload_after,
    reason_codes,
    policy_version,
    now()
  );

  if failpoint = 'before_proposal' then
    raise exception 'INJECTED_FAILURE';
  end if;

  update public.track_programme_proposals
  set status = 'accepted'
  where id = proposal_id and athlete_id = athlete;

  return jsonb_build_object('revision', new_revision, 'status', 'accepted');
end;
$$;

create or replace function public.track_decline_reflow(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete uuid := (payload->>'athlete_id')::uuid;
  proposal_id uuid := (payload->>'proposal_id')::uuid;
  expected_revision integer := (payload->>'expected_revision')::integer;
  proposal_status text;
  proposal_revision integer;
  proposal_fingerprint text;
  product_status text;
  current_revision integer;
  before_week jsonb;
begin
  if coalesce(payload->>'allow_production', 'false') = 'true' then
    raise exception 'TRACK_WRITE_BLOCKED';
  end if;

  perform pg_advisory_xact_lock(hashtext(athlete::text));

  select status into product_status
  from public.track_product_membership
  where athlete_id = athlete;
  if product_status is distinct from 'active' then
    raise exception 'PRODUCT_INACTIVE';
  end if;

  select status, week_revision, fingerprint
    into proposal_status, proposal_revision, proposal_fingerprint
  from public.track_programme_proposals
  where id = proposal_id and athlete_id = athlete
  for update;

  if proposal_status is distinct from 'proposed' or proposal_revision is distinct from expected_revision then
    raise exception 'STALE_RECOMMENDATION';
  end if;

  select coalesce(max(programme_version), 0)
    into current_revision
  from public.track_calendar_sessions
  where athlete_id = athlete and active;

  if current_revision is distinct from expected_revision then
    raise exception 'STALE_RECOMMENDATION';
  end if;

  select coalesce(jsonb_agg(to_jsonb(session) order by session.day_key), '[]'::jsonb)
    into before_week
  from public.track_calendar_sessions session
  where session.athlete_id = athlete and session.active;

  insert into public.track_adaptation_log (
    athlete_id, source, decision, snapshot, proposal, before_week, after_week,
    product, operations, before_revision, after_revision, workload_before, workload_after,
    reason_codes, policy_version, accepted_at
  ) values (
    athlete,
    'daily_readiness',
    'declined',
    coalesce(payload->'snapshot', '{}'::jsonb),
    jsonb_build_object('id', proposal_id, 'fingerprint', proposal_fingerprint, 'week_revision', expected_revision),
    before_week,
    before_week,
    'track',
    '[]'::jsonb,
    expected_revision,
    expected_revision,
    coalesce(payload->'workload_before', '{}'::jsonb),
    coalesce(payload->'workload_before', '{}'::jsonb),
    coalesce(payload->'reason_codes', '[]'::jsonb),
    coalesce(payload->>'policy_version', 'track-loop-v1'),
    now()
  );

  update public.track_programme_proposals
  set status = 'declined'
  where id = proposal_id and athlete_id = athlete;

  return jsonb_build_object('revision', expected_revision, 'status', 'declined');
end;
$$;

revoke all on function public.track_accept_reflow(jsonb) from public, anon, authenticated;
revoke all on function public.track_decline_reflow(jsonb) from public, anon, authenticated;
grant execute on function public.track_accept_reflow(jsonb) to service_role;
grant execute on function public.track_decline_reflow(jsonb) to service_role;

comment on function public.track_accept_reflow(jsonb) is
  'Atomic Track week accept. Granted to service_role only. Rolls back on any failure.';
