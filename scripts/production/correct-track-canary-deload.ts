import { createRequire } from "node:module";
import fs from "node:fs";
import { generatedCalendarRows } from "@/app/lib/track-production/activate";
import { PRODUCTION_TRACK_CANARY_ATHLETE_ID, PRODUCTION_TRACK_CANARY_AUTH_USER_ID } from "@/app/lib/track-production/access";
import type { TrackIntake } from "@/app/lib/track-foundation/types";

const require = createRequire("/tmp/track-pg/package.json");
const { Client } = require("pg") as typeof import("pg");
const CANARY = PRODUCTION_TRACK_CANARY_ATHLETE_ID;
const AUTH = PRODUCTION_TRACK_CANARY_AUTH_USER_ID;

function loadEnv(path: string) {
  for (const line of fs.readFileSync(path, "utf8").split("\n")) {
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

async function main() {
  const apply = process.argv.includes("--apply");
  loadEnv("/Users/kieranhiggs/hybrid365-blueprint-app/.env.local");
  loadEnv("/Users/kieranhiggs/hybrid365-hyrox-performance-profile-phase-1/.env.production-schema-read");
  const connection = process.env.HYROX_PRODUCTION_SCHEMA_READ_URL ?? "";
  if (!connection.includes("uuqdgbsntdjhojjkjkgd")) throw new Error("Refusing connection.");
  const client = new Client({ connectionString: connection, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const athlete = await client.query(`select user_id, payment_status from public.hyrox_athletes where id = $1 and name = 'Hybrid365 Track Canary'`, [CANARY]);
    if (athlete.rows[0]?.user_id !== AUTH || athlete.rows[0]?.payment_status !== "pending") throw new Error("Canary identity did not match.");
    const intakeRow = await client.query(`select intake from public.track_athlete_intake where athlete_id = $1`, [CANARY]);
    const intake = intakeRow.rows[0].intake as TrackIntake;
    const results = await client.query(`select * from public.track_benchmark_results where athlete_id = $1`, [CANARY]);
    const future = generatedCalendarRows({ intake, results: results.rows, weekNumbers: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });
    const stored = await client.query(
      `select id, week_number, day_key, title, status, week_state, programme_version
       from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and programme_version = 2 and week_number > 1
       order by week_number, session_date`,
      [CANARY]
    );
    const wanted = new Map(future.rows.map((row) => [`${row.week_number}:${row.day_key}`, row]));
    const stimulus = /threshold|compromised|race-style|hyrox|long run/i;
    const changes = stored.rows.filter((row) => {
      const next = wanted.get(`${row.week_number}:${row.day_key}`);
      if (!next || next.title === row.title) return false;
      const misplaced = stimulus.test(row.title) && !stimulus.test(next.title);
      const anchorDay = ["Tue", "Thu", "Sat"].includes(row.day_key) && stimulus.test(next.title);
      return misplaced || anchorDay;
    });
    console.log(JSON.stringify(changes.map((row) => ({
      week: row.week_number,
      day: row.day_key,
      from: row.title,
      to: wanted.get(`${row.week_number}:${row.day_key}`)?.title,
      status: row.status,
      state: row.week_state,
    })), null, 2));
    if (!apply) return;
    if (changes.some((row) => row.status !== "planned" || row.week_state !== "future")) {
      throw new Error("A mismatched row is not a planned future session.");
    }
    const charlie = await client.query(`select max(updated_at) as updated_at from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`);
    await client.query("begin");
    for (const row of changes) {
      const next = wanted.get(`${row.week_number}:${row.day_key}`)!;
      await client.query(
        `update public.track_calendar_sessions
         set title = $3, instructions = $4::jsonb, payload = $5::jsonb
         where id = $1 and athlete_id = $2 and status = 'planned' and week_state = 'future' and programme_version = 2`,
        [row.id, CANARY, next.title, JSON.stringify(next.instructions), JSON.stringify(next.payload)]
      );
    }
    const proposal = await client.query(`select id, proposal from public.track_programme_proposals where athlete_id = $1 and fingerprint = 'review-12'`, [CANARY]);
    const body = proposal.rows[0].proposal as { weeks?: Array<{ week: number; days?: Array<{ day: string; title: string }> }> };
    for (const week of body.weeks ?? []) {
      if (week.week === 1) continue;
      for (const day of week.days ?? []) {
        const next = wanted.get(`${week.week}:${day.day}`);
        if (next) day.title = next.title;
      }
    }
    await client.query(
      `update public.track_programme_proposals set proposal = $2::jsonb, published = false where id = $1 and athlete_id = $3`,
      [proposal.rows[0].id, JSON.stringify(body), CANARY]
    );
    const thursday = await client.query(
      `select status, title from public.track_calendar_sessions
       where athlete_id = $1 and week_number = 1 and day_key = 'Thu' and active = true`,
      [CANARY]
    );
    if (thursday.rows[0]?.status !== "completed" || thursday.rows[0]?.title !== "HYROX Lower — Strength Endurance Base") {
      throw new Error("Week 1 Thursday changed.");
    }
    const charlieAfter = await client.query(`select max(updated_at) as updated_at from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`);
    const stamp = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value ?? ""));
    if (stamp(charlie.rows[0].updated_at) !== stamp(charlieAfter.rows[0].updated_at)) throw new Error("Charlie changed.");
    await client.query("commit");
    console.log(`updated ${changes.length}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Correction failed.");
  process.exit(1);
});
