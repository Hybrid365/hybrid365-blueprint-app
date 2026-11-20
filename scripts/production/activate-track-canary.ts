import { createRequire } from "node:module";
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { buildActivationRows } from "@/app/lib/track-production/activate";
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
    throw new Error("Refusing connection: this activation is production-only.");
  }
}

async function proveGate() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  assertProductionUrl(url);
  const admin = createClient(url, service, { auth: { persistSession: false } });
  const names = ["track_accept_reflow", "track_decline_reflow", "track_accept_next_week", "track_open_scheduled_week"] as const;
  for (const name of names) {
    const { error } = await admin.rpc(name, { payload: { athlete_id: CANARY } });
    if (!error || !String(error.message).includes("TRACK_MUTATION_DISABLED")) {
      throw new Error(`${name} did not fail closed.`);
    }
  }
  const other = await admin.rpc("track_accept_reflow", { payload: { athlete_id: "00000000-0000-4000-8000-000000000000" } });
  if (!other.error || !String(other.error.message).includes("TRACK_MUTATION_DISABLED")) {
    throw new Error("A non-canary mutation call did not fail closed.");
  }
  const impl = await admin.rpc("track_accept_reflow_impl", { payload: { athlete_id: CANARY } });
  if (!impl.error) throw new Error("The mutation implementation was callable.");
  const publicClient = createClient(url, anon, { auth: { persistSession: false } });
  const anonCall = await publicClient.rpc("track_accept_reflow", { payload: { athlete_id: CANARY } });
  if (!anonCall.error) throw new Error("Anon could execute a mutation function.");
}

async function main() {
  if (!process.argv.includes("--apply")) throw new Error("Pass --apply to activate this canary.");
  loadEnv("/Users/kieranhiggs/hybrid365-blueprint-app/.env.local");
  loadEnv("/Users/kieranhiggs/hybrid365-hyrox-performance-profile-phase-1/.env.production-schema-read");
  const connection = process.env.HYROX_PRODUCTION_SCHEMA_READ_URL ?? "";
  assertProductionUrl(connection);
  const client = new Client({ connectionString: connection, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const existing = await client.query(`select to_regprocedure('public.track_assert_mutation_allowed(uuid)') as fn`);
    if (!existing.rows[0].fn) {
      const migration = fs.readFileSync("/Users/kieranhiggs/hybrid365-blueprint-app/supabase/migrations/026_track_production_mutation_gate.sql", "utf8");
      await client.query("begin");
      await client.query(migration);
      await client.query("commit");
      await client.query("notify pgrst, 'reload schema'");
    }
    await proveGate();

    const athlete = await client.query(
      `select id, user_id, name, payment_status, programme_status
       from public.hyrox_athletes where id = $1`,
      [CANARY]
    );
    const row = athlete.rows[0];
    if (!row || row.user_id !== AUTH || row.name !== "Hybrid365 Track Canary" || row.payment_status !== "pending") {
      throw new Error("Canary identity did not match.");
    }
    const membership = await client.query(`select status from public.track_product_membership where athlete_id = $1`, [CANARY]);
    if (membership.rows.length !== 1 || membership.rows[0].status !== "active") throw new Error("Track membership is not the single active canary.");
    const others = await client.query(`select count(*)::int as n from public.track_product_membership where athlete_id <> $1`, [CANARY]);
    if (others.rows[0].n !== 0) throw new Error("Another athlete has Track membership.");
    const training = await client.query(`select count(*)::int as n from public.track_calendar_sessions where athlete_id = $1 and kind = 'training'`, [CANARY]);
    if (training.rows[0].n !== 0) throw new Error("Training rows already exist.");
    const proposal = await client.query(
      `select id, published, status, proposal
       from public.track_programme_proposals
       where athlete_id = $1 and fingerprint = 'review-12'
       order by created_at desc limit 1`,
      [CANARY]
    );
    const stored = proposal.rows[0];
    if (!stored || stored.published !== false || stored.proposal?.activated !== false || stored.proposal?.kind !== "programme") {
      throw new Error("The reviewed proposal is not waiting for activation.");
    }
    const profile = await client.query(`select readiness from public.track_performance_profiles where athlete_id = $1`, [CANARY]);
    if (profile.rows[0]?.readiness !== "READY") throw new Error("Profile is not READY.");
    const intakeRow = await client.query(`select intake from public.track_athlete_intake where athlete_id = $1`, [CANARY]);
    const intake = intakeRow.rows[0]?.intake as TrackIntake;
    const results = await client.query(`select * from public.track_benchmark_results where athlete_id = $1`, [CANARY]);
    const anchors = await client.query(
      `select anchor_key, display_value from public.track_training_anchors where athlete_id = $1 and status = 'active' order by anchor_key`,
      [CANARY]
    );
    const charlie = await client.query(
      `select count(*)::int as n, max(updated_at) as updated_at
       from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`
    );
    const gate = await client.query(`select current_setting('track.programme_mutation', true) as gate`);
    if (gate.rows[0].gate === "enabled") throw new Error("Mutation gate is already enabled.");

    const weeks = stored.proposal.weeks as Array<{ week: number; tuesday: string; saturday: string; sunday: string }>;
    const plan = buildActivationRows({ intake, results: results.rows, storedWeeks: weeks });
    const weekOne = plan.rows.filter((item) => item.week_number === 1).map((item) => `${item.day_key} ${item.session_date} ${item.title}`);

    await client.query("begin");
    const locked = await client.query(`select id from public.track_calendar_sessions where athlete_id = $1 and kind = 'training' for update`, [CANARY]);
    if (locked.rows.length !== 0) throw new Error("Training rows appeared before activation.");
    await client.query(
      `update public.track_calendar_sessions
       set active = false
       where athlete_id = $1 and kind = 'assessment' and active = true`,
      [CANARY]
    );
    await client.query(
      `insert into public.track_calendar_sessions
        (athlete_id, programme_version, session_date, day_key, title, kind, status, active, instructions, week_number, programme_key, week_state, payload)
       select $1, 1, x.session_date, x.day_key, x.title, 'training', 'planned', x.active, x.instructions, x.week_number, $2, x.week_state, x.payload
       from jsonb_to_recordset($3::jsonb) as x(
         session_date date,
         day_key text,
         title text,
         active boolean,
         instructions jsonb,
         week_number integer,
         week_state text,
         payload jsonb
       )`,
      [CANARY, plan.programmeKey, JSON.stringify(plan.rows)]
    );
    const updated = await client.query(
      `update public.track_programme_proposals
       set status = 'accepted',
           proposal = proposal || jsonb_build_object('activated', true, 'programmeKey', $2::text)
       where id = $1 and athlete_id = $3 and published = false
       returning published, proposal->>'activated' as activated`,
      [stored.id, plan.programmeKey, CANARY]
    );
    if (updated.rows[0]?.published !== false || updated.rows[0]?.activated !== "true") throw new Error("Proposal activation did not stay unpublished.");
    const status = await client.query(
      `update public.hyrox_athletes
       set programme_status = 'track_active'
       where id = $1 and user_id = $2 and payment_status = 'pending'
       returning programme_status, payment_status`,
      [CANARY, AUTH]
    );
    if (status.rows[0]?.payment_status !== "pending") throw new Error("Payment status changed.");
    const programmes = await client.query(`select count(*)::int as n from public.hyrox_programme_weeks where athlete_id = $1`, [CANARY]);
    if (programmes.rows[0].n !== 0) throw new Error("A 1-1 programme row was created.");
    const charlieAfter = await client.query(
      `select count(*)::int as n, max(updated_at) as updated_at
       from public.hyrox_athletes where name = 'Charlie' or name like 'Charlie %'`
    );
    const stamp = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value ?? ""));
    if (charlieAfter.rows[0].n !== charlie.rows[0].n || stamp(charlieAfter.rows[0].updated_at) !== stamp(charlie.rows[0].updated_at)) {
      throw new Error("Charlie changed during activation.");
    }
    await client.query("commit");

    const active = await client.query(
      `select week_number, count(*)::int as sessions
       from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and active = true
       group by week_number`,
      [CANARY]
    );
    const future = await client.query(
      `select week_number, week_state, bool_and(active = false) as inactive, count(*)::int as sessions
       from public.track_calendar_sessions
       where athlete_id = $1 and kind = 'training' and week_number > 1
       group by week_number, week_state
       order by week_number`,
      [CANARY]
    );
    const log = await client.query(`select count(*)::int as n from public.track_adaptation_log where athlete_id = $1`, [CANARY]);
    const second = await client.query(
      `select id from public.hyrox_athletes
       where id <> $1 and name <> 'Charlie' and name not like 'Charlie %'
       order by created_at asc limit 1`,
      [CANARY]
    );
    const secondId = second.rows[0]?.id ?? null;
    const secondTrack = secondId
      ? await client.query(
          `select
             (select count(*)::int from public.track_product_membership where athlete_id = $1) as membership,
             (select count(*)::int from public.track_calendar_sessions where athlete_id = $1) as sessions,
             (select count(*)::int from public.track_morning_readiness where athlete_id = $1) as readiness`,
          [secondId]
        )
      : { rows: [] };

    console.log(JSON.stringify({
      review: {
        event: intake.event,
        days: intake.availability,
        equipment: intake.equipment,
        anchors: anchors.rows,
        weekOne,
      },
      programmeKey: plan.programmeKey,
      weekStart: plan.weekStart,
      active: active.rows,
      future: future.rows,
      adaptationLog: log.rows[0].n,
      payment: status.rows[0].payment_status,
      programmeStatus: status.rows[0].programme_status,
      charlieUpdatedAt: charlie.rows[0].updated_at,
      secondAthlete: secondId,
      secondTrack: secondTrack.rows[0] ?? null,
      mutationGate: "disabled",
    }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Activation failed.");
  process.exit(1);
});
