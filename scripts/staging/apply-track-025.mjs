/**
 * Apply migration 025 to the canonical staging project only.
 * Refuses production and the dead staging ref. Does not print secrets.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const STAGING_ENV = "/Users/kieranhiggs/hybrid365-hyrox-visual-system-v0/.env.local";
const CANONICAL = "bfwboqaovirzjpxpwgty";
const PRODUCTION = "uuqdgbsntdjhojjkjkgd";
const DEAD = "uluapwqohujavhlpucta";

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

const env = parseEnv(STAGING_ENV);
const urlRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).host.split(".")[0];
const database = env.HYROX_STAGING_DATABASE_URL ?? "";
if (env.HYROX_ENV !== "staging") throw new Error("HYROX_ENV is not staging");
if (env.HYROX_STAGING_SUPABASE_REF !== CANONICAL || urlRef !== CANONICAL) throw new Error("staging ref is not the canonical project");
if (!database.includes(CANONICAL) || database.includes(PRODUCTION) || database.includes(DEAD)) throw new Error("database target refused");

const require = createRequire("/tmp/track-pg/package.json");
const pg = require("pg");
const client = new pg.Client({ connectionString: database, ssl: { rejectUnauthorized: false } });
const sql = readFileSync(resolve("supabase/migrations/025_track_programme_weeks.sql"), "utf8");

await client.connect();
try {
  await client.query(sql);
  await client.query("notify pgrst, 'reload schema'");
  const check = await client.query(
    `select column_name from information_schema.columns
     where table_name = 'track_calendar_sessions' and column_name in ('week_number', 'programme_key', 'week_state')
     order by column_name`
  );
  const fn = await client.query(
    `select proname from pg_proc where proname in ('track_accept_next_week', 'track_open_scheduled_week') order by proname`
  );
  console.log(JSON.stringify({
    target: CANONICAL,
    columns: check.rows.map((row) => row.column_name),
    functions: fn.rows.map((row) => row.proname),
    production: "not written",
  }));
} finally {
  await client.end();
}
