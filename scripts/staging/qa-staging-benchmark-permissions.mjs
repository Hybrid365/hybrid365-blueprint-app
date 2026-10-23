/**
 * Live RLS, idempotency and activation checks for hyrox_athlete_benchmarks on hybrid365-staging ONLY.
 * Signs in as the demo athlete and demo coach with real authenticated sessions.
 * Rows it creates carry a `qa-permissions:` idempotency key and are removed at the end;
 * the original active rows are restored.
 *
 * Run: node scripts/staging/qa-staging-benchmark-permissions.mjs
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { assertStagingTarget, GuardError, loadLocalEnv, proveStagingServiceRole } from "./lib/stagingGuard.mjs";

const DEMO_DOMAIN = "@staging.hybrid365.local";
const QA_PREFIX = "qa-permissions:";

const env = loadLocalEnv();
assertStagingTarget(env, { needServiceRole: true });
await proveStagingServiceRole(env);
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!anonKey) throw new GuardError("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, options);

async function signedIn(email) {
  if (!email.endsWith(DEMO_DOMAIN)) throw new GuardError(`Refusing non-demo user ${email}`);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const client = createClient(url, anonKey, options);
  const { data: session, error: verifyError } = await client.auth.verifyOtp({
    token_hash: data.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) throw verifyError;
  return { client, userId: session.user.id };
}

async function athleteRow(email) {
  const { data, error } = await admin.from("hyrox_athletes").select("id, user_id").eq("email", email).single();
  if (error) throw error;
  return data;
}

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL - ${name}: ${error.message}`);
  }
}

function pendingRow(athleteId, userId, overrides = {}) {
  return {
    athlete_id: athleteId,
    benchmark_type: "run_5k",
    result_value: "17:42",
    result_unit: "seconds",
    normalized_value: 1062,
    normalized_unit: "seconds",
    derived_value: 212.4,
    derived_unit: "sec_per_km",
    result_date: "2026-10-20",
    source: "athlete_submitted",
    status: "pending",
    active_for_programming: false,
    submitted_by_user_id: userId,
    idempotency_key: `${QA_PREFIX}${randomUUID()}`,
    ...overrides,
  };
}

async function activeIds(athleteId) {
  const { data, error } = await admin
    .from("hyrox_athlete_benchmarks")
    .select("id, benchmark_type")
    .eq("athlete_id", athleteId)
    .eq("active_for_programming", true);
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.benchmark_type, r.id]));
}

function activate(client, athleteId, benchmarkId, actorUserId, approve = false) {
  return client.rpc("hyrox_activate_athlete_benchmark", {
    p_athlete_id: athleteId,
    p_benchmark_id: benchmarkId,
    p_actor_user_id: actorUserId,
    p_approve: approve,
  });
}

const competitive = await athleteRow(`demo-competitive${DEMO_DOMAIN}`);
const developing = await athleteRow(`demo-developing${DEMO_DOMAIN}`);
const athlete = await signedIn(`demo-competitive${DEMO_DOMAIN}`);
const coach = await signedIn(`demo-coach${DEMO_DOMAIN}`);
const anon = createClient(url, anonKey, options);
assert.equal(athlete.userId, competitive.user_id, "athlete session is the linked user");
const originalActive = await activeIds(competitive.id);

try {
  await check("athlete reads own benchmark rows", async () => {
    const { data, error } = await athlete.client.from("hyrox_athlete_benchmarks").select("id").eq("athlete_id", competitive.id);
    assert.ifError(error);
    assert.ok(data.length > 0);
  });
  await check("athlete cannot read another athlete's rows", async () => {
    const { data, error } = await athlete.client.from("hyrox_athlete_benchmarks").select("id").eq("athlete_id", developing.id);
    assert.ifError(error);
    assert.equal(data.length, 0);
  });

  let ownPendingId = null;
  await check("athlete can insert a pending result for themselves", async () => {
    const { data, error } = await athlete.client
      .from("hyrox_athlete_benchmarks")
      .insert(pendingRow(competitive.id, athlete.userId))
      .select("id")
      .single();
    assert.ifError(error);
    ownPendingId = data.id;
  });

  const spoofs = {
    "another athlete_id": { athlete_id: developing.id },
    "status approved": { status: "approved" },
    "source coach_entered": { source: "coach_entered" },
    "active_for_programming true": { status: "approved", active_for_programming: true },
    "submitted_by another user": { submitted_by_user_id: coach.userId },
    "submitted_by null": { submitted_by_user_id: null },
    "approved_by set": { approved_by_user_id: athlete.userId },
    "approved_at set": { approved_at: new Date().toISOString() },
    "source_table set": { source_table: "hyrox_performance_test_results" },
    "source_id set": { source_id: randomUUID() },
  };
  for (const [label, overrides] of Object.entries(spoofs)) {
    await check(`athlete insert refused: ${label}`, async () => {
      const { error } = await athlete.client
        .from("hyrox_athlete_benchmarks")
        .insert(pendingRow(competitive.id, athlete.userId, overrides));
      assert.ok(error, "insert should fail");
      assert.equal(error.code, "42501", `expected RLS denial, got ${error.code} ${error.message}`);
    });
  }

  await check("athlete cannot update a benchmark row", async () => {
    const target = originalActive.run_5k;
    const { data, error } = await athlete.client
      .from("hyrox_athlete_benchmarks")
      .update({ normalized_value: 900, status: "approved" })
      .eq("id", target)
      .select("id");
    assert.ifError(error);
    assert.equal(data.length, 0);
    const { data: after } = await admin.from("hyrox_athlete_benchmarks").select("normalized_value").eq("id", target).single();
    assert.notEqual(Number(after.normalized_value), 900);
  });
  await check("athlete cannot delete a benchmark row", async () => {
    const { data, error } = await athlete.client.from("hyrox_athlete_benchmarks").delete().eq("id", ownPendingId).select("id");
    assert.ifError(error);
    assert.equal(data.length, 0);
    const { data: still } = await admin.from("hyrox_athlete_benchmarks").select("id").eq("id", ownPendingId);
    assert.equal(still.length, 1);
  });
  await check("athlete cannot execute the activation function", async () => {
    const { error } = await activate(athlete.client, competitive.id, ownPendingId, athlete.userId, true);
    assert.ok(error, "rpc should fail");
    assert.equal(error.code, "42501", `expected permission denied, got ${error.code}`);
  });

  await check("anon cannot read or insert", async () => {
    const { data } = await anon.from("hyrox_athlete_benchmarks").select("id").limit(1);
    assert.equal((data ?? []).length, 0);
    const { error } = await anon.from("hyrox_athlete_benchmarks").insert(pendingRow(competitive.id, null));
    assert.ok(error);
  });

  await check("coach reads every athlete's rows", async () => {
    const { data, error } = await coach.client
      .from("hyrox_athlete_benchmarks")
      .select("athlete_id")
      .in("athlete_id", [competitive.id, developing.id]);
    assert.ifError(error);
    assert.equal(new Set(data.map((r) => r.athlete_id)).size, 2);
  });
  let coachRowId = null;
  await check("coach can insert an approved result", async () => {
    const { data, error } = await coach.client
      .from("hyrox_athlete_benchmarks")
      .insert(
        pendingRow(competitive.id, coach.userId, {
          source: "coach_entered",
          status: "approved",
          approved_by_user_id: coach.userId,
          approved_at: new Date().toISOString(),
        })
      )
      .select("id")
      .single();
    assert.ifError(error);
    coachRowId = data.id;
  });
  await check("coach can update notes", async () => {
    const { data, error } = await coach.client
      .from("hyrox_athlete_benchmarks")
      .update({ notes: "qa coach note" })
      .eq("id", coachRowId)
      .select("notes");
    assert.ifError(error);
    assert.equal(data[0]?.notes, "qa coach note");
  });
  await check("coach cannot delete a benchmark row", async () => {
    const { data, error } = await coach.client.from("hyrox_athlete_benchmarks").delete().eq("id", coachRowId).select("id");
    assert.ifError(error);
    assert.equal(data.length, 0);
    const { data: still } = await admin.from("hyrox_athlete_benchmarks").select("id").eq("id", coachRowId);
    assert.equal(still.length, 1);
  });
  await check("coach session cannot execute the activation function directly", async () => {
    const { error } = await activate(coach.client, competitive.id, coachRowId, coach.userId);
    assert.ok(error);
    assert.equal(error.code, "42501", `expected permission denied, got ${error.code}`);
  });

  await check("same idempotency key for the same athlete is refused by the database", async () => {
    const key = `${QA_PREFIX}${randomUUID()}`;
    const first = await admin.from("hyrox_athlete_benchmarks").insert(pendingRow(competitive.id, athlete.userId, { idempotency_key: key }));
    assert.ifError(first.error);
    const second = await admin.from("hyrox_athlete_benchmarks").insert(pendingRow(competitive.id, athlete.userId, { idempotency_key: key }));
    assert.equal(second.error?.code, "23505");
    assert.match(second.error.message, /hyrox_athlete_benchmarks_idempotency_key/);
    const { data } = await admin.from("hyrox_athlete_benchmarks").select("id").eq("idempotency_key", key);
    assert.equal(data.length, 1);
  });
  await check("same value with a different key is a separate row", async () => {
    const a = await admin.from("hyrox_athlete_benchmarks").insert(pendingRow(competitive.id, athlete.userId, { result_date: "2026-09-01" })).select("id").single();
    const b = await admin.from("hyrox_athlete_benchmarks").insert(pendingRow(competitive.id, athlete.userId, { result_date: "2026-10-20" })).select("id").single();
    assert.ifError(a.error);
    assert.ifError(b.error);
    assert.notEqual(a.data.id, b.data.id);
  });

  await check("activation refuses a pending row without approve", async () => {
    const { error } = await activate(admin, competitive.id, ownPendingId, coach.userId);
    assert.equal(error?.code, "22023");
  });
  await check("activation refuses a row from another athlete", async () => {
    const { error } = await activate(admin, developing.id, coachRowId, coach.userId);
    assert.equal(error?.code, "P0002");
  });
  await check("activation switches the anchor atomically and keeps history", async () => {
    const { data, error } = await activate(admin, competitive.id, coachRowId, coach.userId);
    assert.ifError(error);
    assert.equal(data.id, coachRowId);
    assert.equal(data.active_for_programming, true);
    const { data: fives } = await admin
      .from("hyrox_athlete_benchmarks")
      .select("id, status, active_for_programming")
      .eq("athlete_id", competitive.id)
      .eq("benchmark_type", "run_5k");
    assert.equal(fives.filter((r) => r.active_for_programming).length, 1);
    const previous = fives.find((r) => r.id === originalActive.run_5k);
    assert.ok(previous, "previous active row still exists");
    assert.equal(previous.status, "approved");
    assert.equal(previous.active_for_programming, false);
  });
  await check("approve-and-activate approves a pending row in one step", async () => {
    const { data, error } = await activate(admin, competitive.id, ownPendingId, coach.userId, true);
    assert.ifError(error);
    assert.equal(data.status, "approved");
    assert.equal(data.active_for_programming, true);
    assert.equal(data.approved_by_user_id, coach.userId);
    const after = await activeIds(competitive.id);
    assert.equal(after.run_5k, ownPendingId);
  });
  await check("concurrent activations leave exactly one active row", async () => {
    const results = await Promise.all(
      [originalActive.run_5k, coachRowId, ownPendingId].map((id) => activate(admin, competitive.id, id, coach.userId))
    );
    for (const r of results) assert.ifError(r.error);
    const { data } = await admin
      .from("hyrox_athlete_benchmarks")
      .select("id")
      .eq("athlete_id", competitive.id)
      .eq("benchmark_type", "run_5k")
      .eq("active_for_programming", true);
    assert.equal(data.length, 1);
  });
} finally {
  if (originalActive.run_5k) await activate(admin, competitive.id, originalActive.run_5k, null);
  const { error } = await admin.from("hyrox_athlete_benchmarks").delete().like("idempotency_key", `${QA_PREFIX}%`);
  if (error) console.log(`cleanup failed: ${error.message}`);
  const restored = await activeIds(competitive.id);
  assert.deepEqual(restored, originalActive, "original active rows restored");
  console.log("cleanup: qa rows removed, original active rows restored");
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
