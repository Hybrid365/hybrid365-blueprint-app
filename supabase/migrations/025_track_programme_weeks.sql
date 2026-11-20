-- Twelve-week Track rows.
-- Only the current week is active. Future weeks are inactive, so a same-week
-- reflow cannot rewrite them. Next-week acceptance writes one new revision.
-- Production callers are not granted execute.

alter table public.track_calendar_sessions
  add column if not exists week_number integer,
  add column if not exists programme_key text,
  add column if not exists week_state text;

alter table public.track_calendar_sessions
  drop constraint if exists track_calendar_week_state_check;

alter table public.track_calendar_sessions
  add constraint track_calendar_week_state_check
  check (week_state is null or week_state in ('active', 'future', 'scheduled', 'history', 'superseded'));

create unique index if not exists track_calendar_week_revision_day_idx
  on public.track_calendar_sessions (athlete_id, programme_key, week_number, day_key, programme_version)
  where week_number is not null and programme_key is not null;

create or replace function public.track_fill_week_identity()
returns trigger
language plpgsql
as $$
declare
  found_week integer;
  found_key text;
begin
  if tg_op = 'UPDATE' and new.active = false and old.active = true and old.week_state = 'active' then
    new.week_state := 'history';
  end if;

  if tg_op = 'INSERT' and new.active and new.week_number is null then
    select s.week_number, s.programme_key
      into found_week, found_key
    from public.track_calendar_sessions s
    where s.athlete_id = new.athlete_id
      and s.week_number is not null
      and s.week_state in ('active', 'history')
    order by s.programme_version desc, s.created_at desc
    limit 1;
    new.week_number := found_week;
    if new.programme_key is null then
      new.programme_key := found_key;
    end if;
    if new.week_state is null then
      new.week_state := 'active';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists track_calendar_week_identity on public.track_calendar_sessions;
create trigger track_calendar_week_identity
  before insert or update on public.track_calendar_sessions
  for each row execute function public.track_fill_week_identity();

create or replace function public.track_accept_next_week(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete uuid := (payload->>'athlete_id')::uuid;
  proposal_id uuid := (payload->>'proposal_id')::uuid;
  expected_revision integer := (payload->>'expected_revision')::integer;
  expected_week integer := (payload->>'expected_week')::integer;
  as_of date := (payload->>'as_of')::date;
  failpoint text := payload->>'failpoint';
  product_status text;
  proposal_status text;
  proposal_revision integer;
  proposal_fingerprint text;
  stored jsonb;
  decision text;
  next_week integer;
  source_revision integer;
  stored_key text;
  active_week integer;
  active_revision integer;
  edge jsonb;
  starts date;
  make_active boolean;
  new_revision integer;
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

  select status, week_revision, fingerprint, proposal
    into proposal_status, proposal_revision, proposal_fingerprint, stored
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
  if stored->>'kind' is distinct from 'next_week' then
    raise exception 'PROPOSAL_NOT_CURRENT';
  end if;
  if proposal_fingerprint is distinct from payload->>'fingerprint' then
    raise exception 'STALE_RECOMMENDATION';
  end if;
  if proposal_revision is distinct from expected_revision then
    raise exception 'REVISION_MISMATCH';
  end if;

  decision := stored->>'decision';
  next_week := (stored->>'week_number')::integer;
  source_revision := (stored->>'source_revision')::integer;
  stored_key := stored->>'programme_key';

  if decision in ('DELOAD', 'COACH_REQUIRED') then
    raise exception 'COACH_REQUIRED';
  end if;
  if decision not in ('KEEP', 'REPEAT', 'PROGRESS', 'REDUCE') then
    raise exception 'INVALID_EDGE';
  end if;

  select max(week_number), max(programme_version)
    into active_week, active_revision
  from public.track_calendar_sessions
  where athlete_id = athlete and active and kind = 'training';

  if active_week is distinct from expected_week or active_revision is distinct from expected_revision then
    raise exception 'REVISION_MISMATCH';
  end if;
  if next_week is distinct from expected_week + 1 then
    raise exception 'REVISION_MISMATCH';
  end if;

  if not exists (
    select 1 from public.track_calendar_sessions
    where athlete_id = athlete
      and week_number = next_week
      and programme_key = stored_key
      and programme_version = source_revision
      and week_state = 'future'
  ) then
    raise exception 'SOURCE_MISSING';
  end if;

  if exists (
    select 1 from public.track_calendar_sessions
    where athlete_id = athlete and week_number = next_week and week_state = 'scheduled'
  ) then
    raise exception 'ALREADY_ACCEPTED';
  end if;

  if decision = 'KEEP' then
    if exists (
      select 1
      from jsonb_array_elements(coalesce(stored->'sessions', '[]'::jsonb)) item
      where not exists (
        select 1 from public.track_calendar_sessions src
        where src.athlete_id = athlete
          and src.week_number = next_week
          and src.programme_version = source_revision
          and src.week_state = 'future'
          and src.day_key = item->>'day_key'
          and src.title = item->>'title'
      )
    ) then
      raise exception 'INVALID_EDGE';
    end if;
  elsif decision = 'REPEAT' then
    if exists (
      select 1
      from jsonb_array_elements(coalesce(stored->'sessions', '[]'::jsonb)) item
      where not exists (
        select 1 from public.track_calendar_sessions cur
        where cur.athlete_id = athlete
          and cur.active
          and cur.day_key = item->>'day_key'
          and cur.title = item->>'title'
      )
    ) then
      raise exception 'INVALID_EDGE';
    end if;
  else
    if jsonb_typeof(stored->'edges') <> 'array' or jsonb_array_length(stored->'edges') = 0 then
      raise exception 'INVALID_EDGE';
    end if;
    for edge in select value from jsonb_array_elements(stored->'edges')
    loop
      if edge->>'family_id' not in ('threshold_volume_a', 'wall_ball_durability_a') then
        raise exception 'INVALID_EDGE';
      end if;
      if decision = 'PROGRESS' and (edge->>'to_block')::integer is distinct from (edge->>'from_block')::integer + 1 then
        raise exception 'INVALID_EDGE';
      end if;
      if decision = 'REDUCE' and (edge->>'to_block')::integer is distinct from (edge->>'from_block')::integer - 1 then
        raise exception 'INVALID_EDGE';
      end if;
      if (edge->>'to_block')::integer < 1 or (edge->>'to_block')::integer > 4 then
        raise exception 'INVALID_EDGE';
      end if;
      if not exists (
        select 1 from jsonb_array_elements(stored->'sessions') item
        where item->'payload'->>'family' = edge->>'family_id'
          and item->>'title' = edge->>'to_title'
      ) then
        raise exception 'INVALID_EDGE';
      end if;
      if not exists (
        select 1 from public.track_calendar_sessions src
        where src.athlete_id = athlete
          and src.week_number = next_week
          and src.programme_version = source_revision
          and src.week_state = 'future'
          and src.payload->>'family' = edge->>'family_id'
          and src.title = edge->>'from_title'
      ) then
        raise exception 'INVALID_EDGE';
      end if;
    end loop;
  end if;

  if failpoint = 'before_write' then
    raise exception 'INJECTED_FAILURE';
  end if;

  update public.track_calendar_sessions
  set week_state = 'superseded'
  where athlete_id = athlete
    and week_number = next_week
    and programme_version = source_revision
    and week_state = 'future';

  if failpoint = 'after_source' then
    raise exception 'INJECTED_FAILURE';
  end if;

  select min((item->>'session_date')::date)
    into starts
  from jsonb_array_elements(stored->'sessions') item;

  make_active := as_of is not null and starts is not null and as_of >= starts;
  new_revision := expected_revision + 1;

  if make_active then
    update public.track_calendar_sessions
    set active = false
    where athlete_id = athlete and active;
  end if;

  insert into public.track_calendar_sessions (
    athlete_id, programme_version, session_date, day_key, title, kind, instructions, status, payload,
    active, week_number, programme_key, week_state
  )
  select
    athlete,
    new_revision,
    (item->>'session_date')::date,
    item->>'day_key',
    item->>'title',
    coalesce(item->>'kind', 'training'),
    coalesce(item->'instructions', '[]'::jsonb),
    'planned',
    coalesce(item->'payload', '{}'::jsonb),
    make_active,
    next_week,
    stored_key,
    case when make_active then 'active' else 'scheduled' end
  from jsonb_array_elements(stored->'sessions') item;

  if failpoint = 'before_provenance' then
    raise exception 'INJECTED_FAILURE';
  end if;

  insert into public.track_adaptation_log (
    athlete_id, source, decision, snapshot, proposal, before_week, after_week,
    product, operations, before_revision, after_revision, workload_before, workload_after,
    reason_codes, policy_version, accepted_at
  ) values (
    athlete,
    'next_week',
    'accepted',
    jsonb_build_object('decision', decision, 'as_of', as_of),
    jsonb_build_object('id', proposal_id, 'fingerprint', proposal_fingerprint, 'kind', 'next_week', 'decision', decision),
    (
      select coalesce(jsonb_agg(jsonb_build_object('day_key', day_key, 'title', title)), '[]'::jsonb)
      from public.track_calendar_sessions
      where athlete_id = athlete and week_number = next_week and programme_version = source_revision
    ),
    stored->'sessions',
    'track',
    stored->'edges',
    expected_revision,
    new_revision,
    coalesce(stored->'workload_before', '{}'::jsonb),
    coalesce(stored->'workload_after', '{}'::jsonb),
    jsonb_build_array(decision),
    'track-loop-v1',
    now()
  );

  update public.track_programme_proposals
  set status = 'accepted'
  where id = proposal_id and athlete_id = athlete;

  return jsonb_build_object(
    'status', 'accepted',
    'decision', decision,
    'week_number', next_week,
    'revision', new_revision,
    'active', make_active
  );
end;
$$;

create or replace function public.track_open_scheduled_week(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  athlete uuid := (payload->>'athlete_id')::uuid;
  as_of date := (payload->>'as_of')::date;
  target_week integer;
  starts date;
begin
  if coalesce(payload->>'allow_production', 'false') = 'true' then
    raise exception 'TRACK_WRITE_BLOCKED';
  end if;

  perform pg_advisory_xact_lock(hashtext(athlete::text));

  select week_number, min(session_date)
    into target_week, starts
  from public.track_calendar_sessions
  where athlete_id = athlete and week_state = 'scheduled'
  group by week_number
  order by week_number
  limit 1;

  if target_week is null or starts is null or as_of is null or as_of < starts then
    return jsonb_build_object('opened', false);
  end if;

  update public.track_calendar_sessions
  set active = false
  where athlete_id = athlete and active;

  update public.track_calendar_sessions
  set active = true, week_state = 'active'
  where athlete_id = athlete and week_number = target_week and week_state = 'scheduled';

  return jsonb_build_object('opened', true, 'week_number', target_week);
end;
$$;

revoke all on function public.track_accept_next_week(jsonb) from public, anon, authenticated;
revoke all on function public.track_open_scheduled_week(jsonb) from public, anon, authenticated;
grant execute on function public.track_accept_next_week(jsonb) to service_role;
grant execute on function public.track_open_scheduled_week(jsonb) to service_role;

comment on function public.track_accept_next_week(jsonb) is
  'Atomic next-week accept for staging. service_role only. Rolls back on any failure.';
