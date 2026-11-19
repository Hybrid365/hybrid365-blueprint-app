/**
 * Next-week accept proof on the Alex Hale staging canary.
 * Failure cases roll back. Success cases are restored before the script ends,
 * except the notes printed for the report. Does not touch production.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const STAGING_ENV = "/Users/kieranhiggs/hybrid365-hyrox-visual-system-v0/.env.local";
const CANONICAL = "bfwboqaovirzjpxpwgty";
const PRODUCTION = "uuqdgbsntdjhojjkjkgd";
const DEAD = "uluapwqohujavhlpucta";
const ATHLETE = "a11ce365-0000-4000-8000-0000000000c1";

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

const env = parseEnv(STAGING_ENV);
const database = env.HYROX_STAGING_DATABASE_URL ?? "";
const urlRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host.split(".")[0];
if (env.HYROX_ENV !== "staging" || env.HYROX_STAGING_SUPABASE_REF !== CANONICAL || urlRef !== CANONICAL) {
  throw new Error("refused target");
}
if (!database.includes(CANONICAL) || database.includes(PRODUCTION) || database.includes(DEAD)) throw new Error("refused database");

const require = createRequire("/tmp/track-pg/package.json");
const pg = require("pg");
const client = new pg.Client({ connectionString: database, ssl: { rejectUnauthorized: false } });

function isoDate(value) {
  if (value instanceof Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

function rowSession(row, title = row.title, payload = row.payload) {
  return {
    day_key: row.day_key,
    session_date: isoDate(row.session_date),
    title,
    kind: row.kind,
    instructions: row.instructions ?? [],
    payload,
  };
}

async function futureWeek(week = 2) {
  const { rows } = await client.query(
    `select * from public.track_calendar_sessions
     where athlete_id = $1 and week_number = $2 and week_state = 'future'
     order by session_date`,
    [ATHLETE, week]
  );
  return rows;
}

async function activeContext() {
  const { rows } = await client.query(
    `select week_number, programme_version, day_key, title
     from public.track_calendar_sessions
     where athlete_id = $1 and active and kind = 'training'
     order by session_date`,
    [ATHLETE]
  );
  return {
    week: rows[0]?.week_number,
    revision: Math.max(...rows.map((row) => row.programme_version)),
    rows,
  };
}

async function expectFail(payload, code) {
  try {
    await client.query(`select public.track_accept_next_week($1::jsonb)`, [JSON.stringify(payload)]);
    throw new Error(`expected ${code}`);
  } catch (error) {
    if (!String(error.message).includes(code)) throw error;
  }
}

async function insertProposal(proposal, fingerprint, revision) {
  const { rows } = await client.query(
    `insert into public.track_programme_proposals
      (athlete_id, readiness, proposal, published, status, week_revision, fingerprint)
     values ($1, 'READY', $2::jsonb, false, 'proposed', $3, $4)
     returning id`,
    [ATHLETE, JSON.stringify(proposal), revision, fingerprint]
  );
  return rows[0].id;
}

async function restore(snapshot) {
  await client.query("begin");
  try {
    await client.query(`select set_config('track.maintenance', 'on', true)`);
    await client.query(
      `delete from public.track_calendar_sessions
       where athlete_id = $1 and week_number = 2 and programme_version > 1`,
      [ATHLETE]
    );
    await client.query(
      `delete from public.track_adaptation_log where athlete_id = $1 and source = 'next_week'`,
      [ATHLETE]
    );
    for (const row of snapshot) {
      await client.query(
        `update public.track_calendar_sessions
         set title = $2, payload = $3::jsonb, week_state = 'future', active = false, instructions = $4::jsonb
         where id = $1`,
        [row.id, row.title, JSON.stringify(row.payload), JSON.stringify(row.instructions ?? [])]
      );
    }
    await client.query(
      `delete from public.track_programme_proposals
       where athlete_id = $1 and proposal->>'kind' = 'next_week' and fingerprint like 'proof-%'`,
      [ATHLETE]
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

async function acceptProof(proposal, fingerprint, revision, week) {
  const id = await insertProposal(proposal, fingerprint, revision);
  const result = await client.query(`select public.track_accept_next_week($1::jsonb) as result`, [
    JSON.stringify({
      athlete_id: ATHLETE,
      proposal_id: id,
      expected_revision: revision,
      expected_week: week,
      fingerprint,
      as_of: "2026-11-19",
    }),
  ]);
  return result.rows[0].result;
}

await client.connect();
const report = {};
let snapshot = [];
try {
  snapshot = await futureWeek(2);
  const active = await activeContext();
  const programmeKey = snapshot[0].programme_key;
  const sourceRevision = snapshot[0].programme_version;
  const baseProposal = {
    kind: "next_week",
    decision: "KEEP",
    week_number: 2,
    source_revision: sourceRevision,
    programme_key: programmeKey,
    edges: [],
    sessions: snapshot.map((row) => rowSession(row)),
    workload_before: {},
    workload_after: {},
  };
  await client.query(`update public.track_product_membership set status = 'active' where athlete_id = $1`, [ATHLETE]);
  await client.query(
    `delete from public.track_programme_proposals where athlete_id = $1 and fingerprint like 'proof-%'`,
    [ATHLETE]
  );
  const real = await client.query(
    `select id, fingerprint, week_revision from public.track_programme_proposals
     where athlete_id = $1 and status = 'proposed' and proposal->>'kind' = 'next_week' and fingerprint like 'KEEP%'
     order by created_at desc limit 1`,
    [ATHLETE]
  );
  const current = real.rows[0];

  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: current.id,
      expected_revision: current.week_revision,
      expected_week: active.week,
      fingerprint: "stale-fingerprint",
      as_of: "2026-11-19",
    },
    "STALE_RECOMMENDATION"
  );
  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: current.id,
      expected_revision: 999,
      expected_week: active.week,
      fingerprint: current.fingerprint,
      as_of: "2026-11-19",
    },
    "REVISION_MISMATCH"
  );

  const invalidId = await insertProposal(
    {
      ...baseProposal,
      decision: "PROGRESS",
      edges: [{ family_id: "sled_push", from_block: 1, to_block: 2, from_title: "Sled", to_title: "Sled heavier" }],
      sessions: snapshot.map((row) => rowSession(row, row.day_key === "Tue" ? "Sled heavier" : row.title, { ...row.payload, family: "sled_push" })),
    },
    "proof-invalid",
    active.revision
  );
  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: invalidId,
      expected_revision: active.revision,
      expected_week: active.week,
      fingerprint: "proof-invalid",
      as_of: "2026-11-19",
    },
    "INVALID_EDGE"
  );

  await client.query(`update public.track_product_membership set status = 'paused' where athlete_id = $1`, [ATHLETE]);
  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: current.id,
      expected_revision: current.week_revision,
      expected_week: active.week,
      fingerprint: current.fingerprint,
      as_of: "2026-11-19",
    },
    "PRODUCT_INACTIVE"
  );
  await client.query(`update public.track_product_membership set status = 'active' where athlete_id = $1`, [ATHLETE]);

  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: current.id,
      expected_revision: current.week_revision,
      expected_week: active.week,
      fingerprint: current.fingerprint,
      as_of: "2026-11-19",
      failpoint: "before_provenance",
    },
    "INJECTED_FAILURE"
  );

  const afterFail = await client.query(
    `select
       count(*) filter (where week_state = 'future')::int as future_rows,
       count(*) filter (where week_state = 'scheduled')::int as scheduled_rows,
       count(*) filter (where active)::int as active_rows
     from public.track_calendar_sessions where athlete_id = $1 and week_number in (1, 2)`,
    [ATHLETE]
  );
  const stillProposed = await client.query(`select status from public.track_programme_proposals where id = $1`, [current.id]);
  report.failClosed = {
    stale: true,
    revisionMismatch: true,
    invalidEdge: true,
    inactiveMembership: true,
    midTransaction: true,
    calendar: afterFail.rows[0],
    proposalStatus: stillProposed.rows[0].status,
  };

  const tuesday = snapshot.find((row) => row.day_key === "Tue");
  const friday = snapshot.find((row) => row.day_key === "Fri");
  await client.query(
    `update public.track_calendar_sessions
     set title = '5 x 5 min Threshold', payload = payload || $2::jsonb
     where id = $1`,
    [tuesday.id, JSON.stringify({ family: "threshold_volume_a", stage: 1 })]
  );
  await client.query(
    `update public.track_calendar_sessions
     set title = 'Wall Ball — 5 x 20 Controlled', payload = payload || $2::jsonb
     where id = $1`,
    [friday.id, JSON.stringify({ family: "wall_ball_durability_a", stage: 1, marker: { hyrox_station_density: 100 } })]
  );
  const progressedSource = await futureWeek(2);
  const progressSessions = progressedSource.map((row) => {
    if (row.day_key === "Tue") {
      return rowSession(row, "6 x 5 min Threshold", {
        ...row.payload,
        family: "threshold_volume_a",
        stage: 2,
        marker: { threshold_total_minutes: 30 },
      });
    }
    if (row.day_key === "Fri") {
      return rowSession(row, "Wall Ball — 4 x 30", {
        ...row.payload,
        family: "wall_ball_durability_a",
        stage: 2,
        marker: { hyrox_station_density: 120 },
      });
    }
    return rowSession(row);
  });
  const progressResult = await acceptProof(
    {
      ...baseProposal,
      decision: "PROGRESS",
      edges: [
        { family_id: "threshold_volume_a", from_block: 1, to_block: 2, from_title: "5 x 5 min Threshold", to_title: "6 x 5 min Threshold" },
        { family_id: "wall_ball_durability_a", from_block: 1, to_block: 2, from_title: "Wall Ball — 5 x 20 Controlled", to_title: "Wall Ball — 4 x 30" },
      ],
      sessions: progressSessions,
    },
    "proof-progress",
    active.revision,
    active.week
  );
  const progressTitles = await client.query(
    `select day_key, title from public.track_calendar_sessions
     where athlete_id = $1 and week_number = 2 and week_state = 'scheduled' and day_key in ('Tue', 'Fri')
     order by day_key`,
    [ATHLETE]
  );
  await expectFail(
    {
      athlete_id: ATHLETE,
      proposal_id: (await client.query(`select id from public.track_programme_proposals where fingerprint = 'proof-progress'`)).rows[0].id,
      expected_revision: active.revision,
      expected_week: active.week,
      fingerprint: "proof-progress",
      as_of: "2026-11-19",
    },
    "ALREADY_ACCEPTED"
  );
  report.progress = { result: progressResult, titles: progressTitles.rows };
  await restore(snapshot);

  const repeatSessions = snapshot.map((row) => {
    const today = active.rows.find((item) => item.day_key === row.day_key);
    return rowSession(row, today?.title ?? row.title, row.payload);
  });
  const repeatResult = await acceptProof(
    { ...baseProposal, decision: "REPEAT", edges: [], sessions: repeatSessions },
    "proof-repeat",
    active.revision,
    active.week
  );
  const repeatTuesday = await client.query(
    `select title from public.track_calendar_sessions
     where athlete_id = $1 and week_number = 2 and week_state = 'scheduled' and day_key = 'Tue'`,
    [ATHLETE]
  );
  report.repeat = { result: repeatResult, tuesday: repeatTuesday.rows[0]?.title, activeTuesday: active.rows.find((row) => row.day_key === "Tue")?.title };
  await restore(snapshot);

  const reduceSessions = snapshot.map((row) =>
    row.day_key === "Tue"
      ? rowSession(row, "5 x 5 min Threshold", { ...row.payload, family: "threshold_volume_a", stage: 1 })
      : rowSession(row)
  );
  const reduceResult = await acceptProof(
    {
      ...baseProposal,
      decision: "REDUCE",
      edges: [{ family_id: "threshold_volume_a", from_block: 2, to_block: 1, from_title: tuesday.title, to_title: "5 x 5 min Threshold" }],
      sessions: reduceSessions,
    },
    "proof-reduce",
    active.revision,
    active.week
  );
  const reduceTuesday = await client.query(
    `select title from public.track_calendar_sessions
     where athlete_id = $1 and week_number = 2 and week_state = 'scheduled' and day_key = 'Tue'`,
    [ATHLETE]
  );
  report.reduce = { result: reduceResult, tuesday: reduceTuesday.rows[0]?.title, from: tuesday.title };
  await restore(snapshot);

  const keepResult = await acceptProof(
    { ...baseProposal, decision: "KEEP", sessions: snapshot.map((row) => rowSession(row)) },
    "proof-keep",
    active.revision,
    active.week
  );
  const keepTuesday = await client.query(
    `select title, week_state from public.track_calendar_sessions
     where athlete_id = $1 and week_number = 2 and week_state = 'scheduled' and day_key = 'Tue'`,
    [ATHLETE]
  );
  report.keep = { result: keepResult, tuesday: keepTuesday.rows[0] };
  await restore(snapshot);

  const restored = await futureWeek(2);
  report.restored = restored.map((row) => `${row.day_key} ${row.title}`);
  report.week3 = (
    await client.query(
      `select day_key, title from public.track_calendar_sessions
       where athlete_id = $1 and week_number = 3 and week_state = 'future' and day_key = 'Tue'`,
      [ATHLETE]
    )
  ).rows[0];
  report.activeWeek = (await activeContext()).week;
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (snapshot.length) await restore(snapshot).catch(() => undefined);
  await client.end();
}
