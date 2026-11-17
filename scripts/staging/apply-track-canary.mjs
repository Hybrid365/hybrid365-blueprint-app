/**
 * Apply Track migrations 021–023 to the canonical staging project and prove the accept transaction.
 * Refuses production and the dead staging ref. Does not print secrets.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const STAGING_ENV = "/Users/kieranhiggs/hybrid365-hyrox-visual-system-v0/.env.local";
const CANONICAL = "bfwboqaovirzjpxpwgty";
const PRODUCTION = "uuqdgbsntdjhojjkjkgd";
const DEAD = "uluapwqohujavhlpucta";
const ATHLETE = "c0ffee00-1111-4111-8111-000000000365";

function parseEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[trimmed.slice(0, eq).trim()] = value;
  }
  return env;
}

function assertTarget(env) {
  const urlRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host.split(".")[0];
  const database = env.HYROX_STAGING_DATABASE_URL ?? "";
  if (env.HYROX_ENV !== "staging") throw new Error("HYROX_ENV is not staging");
  if (env.HYROX_STAGING_SUPABASE_REF !== CANONICAL || urlRef !== CANONICAL) throw new Error("staging ref is not the canonical project");
  if (!database.includes(CANONICAL) || database.includes(PRODUCTION) || database.includes(DEAD)) {
    throw new Error("database target refused");
  }
}

const env = parseEnv(STAGING_ENV);
assertTarget(env);

const require = createRequire("/tmp/track-pg/package.json");
const pg = require("pg");
const client = new pg.Client({ connectionString: env.HYROX_STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });

const root = resolve("supabase/migrations");
const files = [
  "021_track_athlete_foundation.sql",
  "022_track_coaching_loop.sql",
  "023_track_accept_transaction.sql",
];

function dayDate(day) {
  return {
    Mon: "2026-11-16",
    Tue: "2026-11-17",
    Wed: "2026-11-18",
    Thu: "2026-11-19",
    Fri: "2026-11-20",
    Sat: "2026-11-21",
    Sun: "2026-11-22",
  }[day];
}

async function resetWeek() {
  await client.query(
    `select set_config('track.maintenance', 'on', true);
     delete from public.track_session_feedback where athlete_id = '${ATHLETE}';
     delete from public.track_adaptation_log where athlete_id = '${ATHLETE}';
     delete from public.track_calendar_sessions where athlete_id = '${ATHLETE}';
     delete from public.track_programme_proposals where athlete_id = '${ATHLETE}';
     delete from public.track_weekly_checkins where athlete_id = '${ATHLETE}';
     delete from public.track_escalations where athlete_id = '${ATHLETE}';`
  );
  const days = [
    ["Mon", "Easy run", "planned"],
    ["Tue", "5 x 5 min Threshold", "planned"],
    ["Wed", "Easy run", "planned"],
    ["Thu", "Easy run", "planned"],
    ["Fri", "HYROX", "planned"],
    ["Sat", "HYROX session", "planned"],
    ["Sun", "Long run", "planned"],
  ];
  const ids = {};
  for (const [day, title, status] of days) {
    const inserted = await client.query(
      `insert into public.track_calendar_sessions
        (athlete_id, programme_version, session_date, day_key, title, kind, status, payload, active)
       values ($1, 1, $2, $3, $4, 'training', $5, $6, true)
       returning id`,
      [ATHLETE, dayDate(day), day, title, status, JSON.stringify(title.includes("Threshold") ? { threshold_min: 25 } : { easy_min: 40 })]
    );
    ids[day] = inserted.rows[0].id;
  }
  return ids;
}

async function proposal(fingerprint, revision = 1) {
  const inserted = await client.query(
    `insert into public.track_programme_proposals
      (athlete_id, readiness, proposal, published, status, week_revision, fingerprint)
     values ($1, 'PARTIALLY_READY', '{}'::jsonb, false, 'proposed', $2, $3)
     returning id`,
    [ATHLETE, revision, fingerprint]
  );
  return inserted.rows[0].id;
}

async function expectError(run, code) {
  try {
    await run();
  } catch (error) {
    if (String(error.message).includes(code)) return;
    throw new Error(`expected ${code} but got ${error.message.split("\n")[0]}`);
  }
  throw new Error(`expected ${code} but the call succeeded`);
}

async function activeWeek() {
  const rows = await client.query(
    `select day_key, title, status, programme_version
     from public.track_calendar_sessions
     where athlete_id = $1 and active
     order by session_date`,
    [ATHLETE]
  );
  return rows.rows;
}

const failures = [];
function check(condition, message) {
  if (!condition) failures.push(message);
}

async function main() {
await client.connect();
try {
  for (const file of files) {
    await client.query(readFileSync(`${root}/${file}`, "utf8"));
  }

  await client.query(
    `insert into public.hyrox_athletes (id, name, email, status, programme_status, payment_status)
     values ($1, 'Track staging canary', 'track-staging-canary@hybrid365.test', 'accepted', 'not_started', 'paid')
     on conflict (id) do update set payment_status = 'paid'`,
    [ATHLETE]
  );
  await client.query(
    `insert into public.track_product_membership (athlete_id, status)
     values ($1, 'active')
     on conflict (athlete_id) do update set status = 'active'`,
    [ATHLETE]
  );
  await client.query(
    `insert into public.track_athlete_intake (athlete_id, intake)
     values ($1, '{"goal":"hyrox"}'::jsonb)
     on conflict (athlete_id) do nothing`,
    [ATHLETE]
  );

  let ids = await resetWeek();
  let proposalId = await proposal("fp");
  for (const point of ["after_version", "after_first_operation", "before_provenance", "before_proposal"]) {
    await expectError(
      () =>
        client.query("select public.track_accept_reflow($1::jsonb)", [
          JSON.stringify({
            athlete_id: ATHLETE,
            proposal_id: proposalId,
            expected_revision: 1,
            policy_version: "track-loop-v1",
            failpoint: point,
            operations: [{ op: "replace", session_id: ids.Tue, title: "Easy bike" }],
            snapshot: { interpretation: "FATIGUED" },
            workload_before: { threshold_min: 25 },
            workload_after: { threshold_min: 25 },
            reason_codes: ["readiness"],
          }),
        ]),
      "INJECTED_FAILURE"
    );
    const week = await activeWeek();
    check(week.length === 7 && week.every((row) => row.programme_version === 1), `${point} rolled back`);
    const status = await client.query("select status from public.track_programme_proposals where id = $1", [proposalId]);
    check(status.rows[0].status === "proposed", `${point} left the proposal proposed`);
  }

  await client.query("update public.track_calendar_sessions set status = 'completed' where id = $1", [ids.Mon]);
  const blocked = await proposal("completed-move");
  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({
          athlete_id: ATHLETE,
          proposal_id: blocked,
          expected_revision: 1,
          operations: [{ op: "move", session_id: ids.Mon, to_day: "Tue", session_date: dayDate("Tue") }],
        }),
      ]),
    "COMPLETED_SESSION"
  );
  const monday = await client.query("select status, active, day_key from public.track_calendar_sessions where id = $1", [ids.Mon]);
  check(monday.rows[0].status === "completed" && monday.rows[0].active && monday.rows[0].day_key === "Mon", "completed session stayed");

  await client.query("update public.track_calendar_sessions set status = 'started' where id = $1", [ids.Sun]);
  const started = await proposal("started-move");
  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({
          athlete_id: ATHLETE,
          proposal_id: started,
          expected_revision: 1,
          operations: [{ op: "move", session_id: ids.Sun, to_day: "Sat", session_date: dayDate("Sat") }],
        }),
      ]),
    "COMPLETED_SESSION"
  );

  const stale = await proposal("stale", 9);
  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({
          athlete_id: ATHLETE,
          proposal_id: stale,
          expected_revision: 9,
          operations: [{ op: "replace", session_id: ids.Tue, title: "Easy bike" }],
        }),
      ]),
    "STALE_RECOMMENDATION"
  );

  const acceptId = await proposal("tuesday-low");
  const workloadBefore = { threshold_min: 25, bike_min: 0, easy_run_min: 120 };
  const workloadAfter = { threshold_min: 25, bike_min: 40, easy_run_min: 80 };
  const accepted = await client.query("select public.track_accept_reflow($1::jsonb) as result", [
    JSON.stringify({
      athlete_id: ATHLETE,
      proposal_id: acceptId,
      expected_revision: 1,
      policy_version: "track-loop-v1",
      snapshot: { interpretation: "FATIGUED", product: "track" },
      workload_before: workloadBefore,
      workload_after: workloadAfter,
      reason_codes: ["recovery_below_baseline"],
      operations: [
        { op: "remove", session_id: ids.Thu },
        { op: "move", session_id: ids.Wed, to_day: "Thu", session_date: dayDate("Thu") },
        { op: "move", session_id: ids.Tue, to_day: "Wed", session_date: dayDate("Wed") },
        { op: "insert", day_key: "Tue", title: "Easy bike", session_date: dayDate("Tue"), payload: { bike_min: 40 } },
      ],
    }),
  ]);
  check(accepted.rows[0].result.revision === 2, "accept returned revision 2");
  const week = await activeWeek();
  const byDay = Object.fromEntries(week.map((row) => [row.day_key, row.title]));
  check(byDay.Tue === "Easy bike" && byDay.Wed === "5 x 5 min Threshold" && byDay.Thu === "Easy run", `home week ${JSON.stringify(byDay)}`);
  check(week.filter((row) => row.title === "5 x 5 min Threshold").length === 1, "threshold was not duplicated");
  check(week.find((row) => row.day_key === "Mon")?.status === "completed", "completed Monday carried forward");
  check(week.find((row) => row.day_key === "Fri")?.title === "HYROX", "HYROX anchor stayed");
  const history = await client.query(
    "select count(*)::int as count from public.track_calendar_sessions where athlete_id = $1 and active = false",
    [ATHLETE]
  );
  check(history.rows[0].count === 7, "prior week was versioned");
  const provenance = await client.query(
    "select decision, policy_version, before_revision, after_revision, workload_before, workload_after from public.track_adaptation_log where athlete_id = $1 and decision = 'accepted'",
    [ATHLETE]
  );
  check(provenance.rows[0].before_revision === 1 && provenance.rows[0].after_revision === 2, "provenance revisions");
  check(provenance.rows[0].workload_after.bike_min === 40 && provenance.rows[0].workload_after.threshold_min === 25, "workload after");

  const second = new pg.Client({ connectionString: env.HYROX_STAGING_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await second.connect();
  const currentIds = await client.query(
    "select id, day_key from public.track_calendar_sessions where athlete_id = $1 and active and day_key = 'Fri'",
    [ATHLETE]
  );
  const raceProposal = await proposal("race", 2);
  const racePayload = JSON.stringify({
    athlete_id: ATHLETE,
    proposal_id: raceProposal,
    expected_revision: 2,
    operations: [{ op: "replace", session_id: currentIds.rows[0].id, title: "Easy bike" }],
  });
  const raced = await Promise.allSettled([
    client.query("select public.track_accept_reflow($1::jsonb)", [racePayload]),
    second.query("select public.track_accept_reflow($1::jsonb)", [racePayload]),
  ]);
  await second.end();
  const ok = raced.filter((item) => item.status === "fulfilled").length;
  const conflict = raced.filter((item) => item.status === "rejected" && /ALREADY_ACCEPTED|STALE_RECOMMENDATION/.test(item.reason.message)).length;
  check(ok === 1 && conflict === 1, `concurrency ok=${ok} conflict=${conflict}`);
  const activeRevisions = await client.query(
    "select count(distinct programme_version)::int as revisions from public.track_calendar_sessions where athlete_id = $1 and active",
    [ATHLETE]
  );
  check(activeRevisions.rows[0].revisions === 1, "one active revision");

  const beforeDecline = await activeWeek();
  const declineId = await proposal("decline-key", 3);
  await client.query("select public.track_decline_reflow($1::jsonb)", [
    JSON.stringify({ athlete_id: ATHLETE, proposal_id: declineId, expected_revision: 3, snapshot: { interpretation: "FATIGUED" } }),
  ]);
  const afterDecline = await activeWeek();
  check(JSON.stringify(afterDecline) === JSON.stringify(beforeDecline), "decline left the programme unchanged");
  const declined = await client.query(
    "select decision, before_revision from public.track_adaptation_log where athlete_id = $1 and decision = 'declined'",
    [ATHLETE]
  );
  check(declined.rows.length === 1 && declined.rows[0].before_revision === 3, "decline stored");
  const suppressed = await proposal("decline-key", 3);
  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({
          athlete_id: ATHLETE,
          proposal_id: suppressed,
          expected_revision: 3,
          operations: [{ op: "replace", session_id: currentIds.rows[0].id, title: "Easy run" }],
        }),
      ]),
    "SUPPRESSED"
  );

  await client.query(
    `insert into public.track_weekly_checkins (athlete_id, week_of, answers, note)
     values ($1, '2026-11-16', '{"recovery":7}'::jsonb, null),
            ($1, '2026-11-16', '{"recovery":8,"motivation":8}'::jsonb, null)`,
    [ATHLETE]
  );
  const checkins = await client.query(
    "select answers from public.track_weekly_checkins where athlete_id = $1 order by created_at",
    [ATHLETE]
  );
  check(checkins.rows.length === 2 && checkins.rows[1].answers.recovery === 8, "check-in history kept");
  await expectError(
    () => client.query("update public.track_weekly_checkins set note = 'overwrite' where athlete_id = $1", [ATHLETE]),
    "APPEND_ONLY"
  );

  const session = await client.query(
    "select id from public.track_calendar_sessions where athlete_id = $1 and active and day_key = 'Wed'",
    [ATHLETE]
  );
  await client.query(
    `insert into public.track_session_feedback (athlete_id, session_id, completion, rpe, feel, pain, actuals)
     values ($1, $2, 'completed', 7, 'expected', false, '{"Threshold":25}'::jsonb)`,
    [ATHLETE, session.rows[0].id]
  );
  const feedback = await client.query("select rpe, actuals from public.track_session_feedback where athlete_id = $1", [ATHLETE]);
  check(feedback.rows[0].rpe === 7 && feedback.rows[0].actuals.Threshold === 25, "feedback actual stored");

  for (const kind of ["PAIN_REVIEW", "REPEATED_FATIGUE", "NO_SAFE_REFLOW"]) {
    await client.query(
      "insert into public.track_escalations (athlete_id, kind, summary) values ($1, $2, $3)",
      [ATHLETE, kind, `${kind} staging fixture`]
    );
  }
  const escalations = await client.query("select kind from public.track_escalations where athlete_id = $1 order by kind", [ATHLETE]);
  check(escalations.rows.map((row) => row.kind).join(",") === "NO_SAFE_REFLOW,PAIN_REVIEW,REPEATED_FATIGUE", "escalations stored");

  await client.query("update public.track_product_membership set status = 'paused' where athlete_id = $1", [ATHLETE]);
  const pausedProposal = await proposal("paused", 3);
  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({
          athlete_id: ATHLETE,
          proposal_id: pausedProposal,
          expected_revision: 3,
          operations: [{ op: "replace", session_id: session.rows[0].id, title: "Rest" }],
        }),
      ]),
    "PRODUCT_INACTIVE"
  );
  await client.query("update public.track_product_membership set status = 'active' where athlete_id = $1", [ATHLETE]);

  await expectError(
    () =>
      client.query("select public.track_accept_reflow($1::jsonb)", [
        JSON.stringify({ allow_production: true, athlete_id: ATHLETE, operations: [{ op: "replace" }] }),
      ]),
    "TRACK_WRITE_BLOCKED"
  );

  const policies = await client.query(
    `select tablename, policyname, cmd
     from pg_policies
     where schemaname = 'public' and tablename like 'track_%'
     order by tablename, policyname`
  );
  const adaptationWrites = policies.rows.filter(
    (row) => row.tablename === "track_adaptation_log" && /INSERT|UPDATE|ALL/.test(row.cmd) && /athlete/.test(row.policyname)
  );
  check(adaptationWrites.length === 0, "athlete cannot write provenance");
  const functions = await client.query(
    `select routine_name from information_schema.routines
     where routine_schema = 'public' and routine_name in ('track_accept_reflow', 'track_decline_reflow')`
  );
  check(functions.rows.length === 2, "accept and decline functions exist");
  const catalog = await client.query(
    `select
       (select count(*) from information_schema.tables where table_schema = 'public' and table_name like 'track_%') as tables,
       (select count(*) from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace where n.nspname = 'public' and t.relname like 'track_%') as constraints,
       (select count(*) from pg_indexes where schemaname = 'public' and tablename like 'track_%') as indexes`
  );
  const grants = await client.query(
    `select routine_name, grantee, privilege_type
     from information_schema.routine_privileges
     where routine_schema = 'public' and routine_name in ('track_accept_reflow', 'track_decline_reflow')
     order by routine_name, grantee`
  );
  console.log(`staging catalog ${JSON.stringify(catalog.rows[0])}`);
  console.log(`policies ${policies.rows.map((row) => `${row.tablename}:${row.policyname}:${row.cmd}`).join(" | ")}`);
  console.log(`grants ${grants.rows.map((row) => `${row.routine_name}:${row.grantee}:${row.privilege_type}`).join(" | ")}`);
  console.log(`active week after accept ${week.map((row) => `${row.day_key} ${row.title}`).join(", ")}`);
} catch (error) {
  const message = String(error.message ?? error).replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]");
  console.error(message.split("\n")[0]);
  process.exitCode = 1;
  return;
} finally {
  await client.end();
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Staging Track accept transaction passed.");
}

main();
