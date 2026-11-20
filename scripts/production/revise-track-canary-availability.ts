import { createRequire } from "node:module";
import fs from "node:fs";
import { generatedCalendarRows } from "@/app/lib/track-production/activate";
import { PRODUCTION_TRACK_CANARY_ATHLETE_ID, PRODUCTION_TRACK_CANARY_AUTH_USER_ID } from "@/app/lib/track-production/access";
import type { TrackIntake } from "@/app/lib/track-foundation/types";

const require = createRequire("/tmp/track-pg/package.json");
const { Client } = require("pg") as {
  Client: new (config: { connectionString: string; ssl?: { rejectUnauthorized: boolean } }) => {
    connect(): Promise<void>;
    query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, any>> }>;
    end(): Promise<void>;
  };
};

const CANARY = PRODUCTION_TRACK_CANARY_ATHLETE_ID;
const AUTH = PRODUCTION_TRACK_CANARY_AUTH_USER_ID;
const REF = "uuqdgbsntdjhojjkjkgd";
const PURPOSE = "Local muscular endurance for late-race legs — not max strength.";

function loadEnv(path: string) {
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function assertProductionUrl(url: string) {
  if (!url.includes(REF) || url.includes("bfwboqaovirzjpxpwgty") || url.includes("uluapwqohujavhlpucta")) {
    throw new Error("Refusing connection: this revision is production-only.");
  }
}

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Pass --apply to revise this canary.");
  loadEnv("/Users/kieranhiggs/hybrid365-blueprint-app/.env.local");
  loadEnv("/Users/kieranhiggs/hybrid365-hyrox-performance-profile-phase-1/.env.production-schema-read");
  const connection = process.env.HYROX_PRODUCTION_SCHEMA_READ_URL ?? "";
  assertProductionUrl(connection);
  const client = new Client({ connectionString: connection, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const gate = await client.query(`select current_setting('track.programme_mutation', true) as gate`);
    if (gate.rows[0].gate === "enabled") throw new Error("Mutation gate is enabled.");
    const athlete = await client.query(`select user_id, name, payment_status from public.hyrox_athletes where id = $1`, [CANARY]);
    if (athlete.rows[0]?.user_id !== AUTH || athlete.rows[0]?.name !== "Hybrid365 Track Canary" || athlete.rows[0]?.payment_status !== "pending") {
      throw new Error("Canary identity did not match.");
    }
    const intakeRow = await client.query(`select intake from public.track_athlete_intake where athlete_id = $1`, [CANARY]);
    const intake = intakeRow.rows[0].intake as TrackIntake;
    if (!intake.availability.unavailableDays.includes("Sun")) throw new Error("Sunday is not stored as unavailable.");
    const results = await client.query(`select * from public.track_benchmark_results where athlete_id = $1`, [CANARY]);
    const before = await client.query(
      `select id, day_key, title, status, programme_version, programme_key, session_date, instructions, payload
       from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and week_number = 1 and programme_version = 1
       order by session_date`,
      [CANARY]
    );
    const thursday = before.rows.find((row) => row.day_key === "Thu");
    const sunday = before.rows.find((row) => row.day_key === "Sun");
    const monday = before.rows.find((row) => row.day_key === "Mon");
    if (!thursday || thursday.status !== "completed" || thursday.title !== "HYROX Lower — Strength Endurance Base") {
      throw new Error("Thursday completion is not the expected strength session.");
    }
    if (!sunday || !/long/i.test(sunday.title) || !monday) throw new Error("Week 1 does not have the Sunday long run to move.");
    const logsBefore = await client.query(`select count(*)::int as n from public.track_adaptation_log where athlete_id = $1`, [CANARY]);
    const feedbackBefore = await client.query(`select count(*)::int as n from public.track_session_feedback where session_id = $1`, [thursday.id]);
    const charlie = await client.query(`select count(*)::int as n, max(updated_at) as updated_at from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`);
    const future = generatedCalendarRows({ intake, results: results.rows, weekNumbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });

    await client.query("begin");
    await client.query(
      `update public.track_calendar_sessions
       set active = false
       where athlete_id = $1 and id = any($2::uuid[])`,
      [CANARY, [sunday.id, monday.id]]
    );
    await client.query(
      `insert into public.track_calendar_sessions
        (athlete_id, programme_version, session_date, day_key, title, kind, status, active, instructions, week_number, programme_key, week_state, payload)
       values ($1, 2, $2, 'Mon', $3, 'training', 'planned', true, $4::jsonb, 1, $5, 'active', $6::jsonb)`,
      [CANARY, monday.session_date, sunday.title, JSON.stringify(sunday.instructions), sunday.programme_key, JSON.stringify(sunday.payload)]
    );
    await client.query(
      `update public.track_calendar_sessions
       set payload = jsonb_set(payload, '{purpose}', to_jsonb($3::text), true)
       where athlete_id = $1 and id = $2 and status = 'completed' and title = 'HYROX Lower — Strength Endurance Base'`,
      [CANARY, thursday.id, PURPOSE]
    );
    await client.query(
      `update public.track_calendar_sessions
       set week_state = 'superseded'
       where athlete_id = $1 and kind = 'training' and week_number > 1 and programme_version = 1`,
      [CANARY]
    );
    await client.query(
      `insert into public.track_calendar_sessions
        (athlete_id, programme_version, session_date, day_key, title, kind, status, active, instructions, week_number, programme_key, week_state, payload)
       select $1, 2, x.session_date, x.day_key, x.title, 'training', 'planned', false, x.instructions, x.week_number, $2, 'future', x.payload
       from jsonb_to_recordset($3::jsonb) as x(
         session_date date, day_key text, title text, instructions jsonb, week_number integer, payload jsonb
       )`,
      [CANARY, future.programmeKey, JSON.stringify(future.rows)]
    );
    const weekOneAfter = await client.query(
      `select day_key, title, status, active, programme_version
       from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and week_number = 1 and active = true
       order by session_date`,
      [CANARY]
    );
    const proposal = await client.query(
      `select id, proposal from public.track_programme_proposals
       where athlete_id = $1 and fingerprint = 'review-12'`,
      [CANARY]
    );
    const daysByWeek = new Map<number, Array<{ day: string; title: string }>>();
    for (const row of weekOneAfter.rows) {
      const list = daysByWeek.get(1) ?? [];
      list.push({ day: row.day_key, title: row.title });
      daysByWeek.set(1, list);
    }
    for (const row of future.rows) {
      const list = daysByWeek.get(row.week_number) ?? [];
      list.push({ day: row.day_key, title: row.title });
      daysByWeek.set(row.week_number, list);
    }
    const weeks = [...daysByWeek.entries()].sort((a, b) => a[0] - b[0]).map(([week, days]) => ({
      week,
      deload: week % 4 === 0,
      days,
    }));
    await client.query(
      `update public.track_programme_proposals
       set proposal = proposal || jsonb_build_object('availabilityRevision', 2, 'weeks', $2::jsonb),
           published = false
       where id = $1 and athlete_id = $3`,
      [proposal.rows[0].id, JSON.stringify(weeks), CANARY]
    );
    const thursdayAfter = await client.query(`select title, status, instructions from public.track_calendar_sessions where id = $1`, [thursday.id]);
    if (thursdayAfter.rows[0].status !== "completed" || thursdayAfter.rows[0].title !== thursday.title) {
      throw new Error("Thursday completion changed.");
    }
    if (JSON.stringify(thursdayAfter.rows[0].instructions) !== JSON.stringify(thursday.instructions)) {
      throw new Error("Thursday workout changed.");
    }
    const feedbackAfter = await client.query(`select count(*)::int as n from public.track_session_feedback where session_id = $1`, [thursday.id]);
    if (feedbackAfter.rows[0].n !== feedbackBefore.rows[0].n) throw new Error("Thursday feedback changed.");
    const logsAfter = await client.query(`select count(*)::int as n from public.track_adaptation_log where athlete_id = $1`, [CANARY]);
    if (logsAfter.rows[0].n !== logsBefore.rows[0].n) throw new Error("An adaptation log was written.");
    const activeWeeks = await client.query(
      `select week_number, count(*)::int as n from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and active = true group by week_number`,
      [CANARY]
    );
    if (activeWeeks.rows.length !== 1 || activeWeeks.rows[0].week_number !== 1) throw new Error("Active week count changed.");
    const sundayActive = await client.query(
      `select count(*)::int as n from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and active = true and day_key = 'Sun'`,
      [CANARY]
    );
    if (sundayActive.rows[0].n !== 0) throw new Error("Sunday still has an active session.");
    const charlieAfter = await client.query(`select count(*)::int as n, max(updated_at) as updated_at from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`);
    const stamp = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value ?? ""));
    if (charlieAfter.rows[0].n !== charlie.rows[0].n || stamp(charlieAfter.rows[0].updated_at) !== stamp(charlie.rows[0].updated_at)) {
      throw new Error("Charlie changed.");
    }
    await client.query("commit");
    console.log(JSON.stringify({
      before: before.rows.map((row) => `${row.day_key} ${row.title} ${row.status}`),
      after: weekOneAfter.rows.map((row) => `${row.day_key} ${row.title} ${row.status} v${row.programme_version}`),
      futureWeeks: future.rows.filter((row) => row.day_key === "Tue" || row.day_key === "Thu" || row.day_key === "Sat").map((row) => `W${row.week_number} ${row.day_key} ${row.title}`),
      purpose: PURPOSE,
      charlie: stamp(charlie.rows[0].updated_at),
    }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Revision failed.");
  process.exit(1);
});
