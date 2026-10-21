/**
 * Seeds, resets, or signs in the HYROX demo athletes on hybrid365-staging ONLY.
 * Every row it touches belongs to an @staging.hybrid365.local user.
 *
 *   node scripts/staging/seed-hyrox-demo-athletes.mjs                 dry run (no writes)
 *   node scripts/staging/seed-hyrox-demo-athletes.mjs --apply         create or refresh demo users and rows
 *   node scripts/staging/seed-hyrox-demo-athletes.mjs --reset         delete demo users and their rows
 *   node scripts/staging/seed-hyrox-demo-athletes.mjs --login demo-competitive
 *                                                                     print a one-time local sign-in link
 *
 * Seeded from fixtures: auth user, athlete profile role, hyrox_athletes row, submitted
 * 5K / SkiErg / RowErg tests, and the race as history. FTP, threshold pace, and historical
 * benchmark rows need the Performance Profile schema (021) and are skipped on main.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { assertStagingTarget, GuardError, loadLocalEnv, proveStagingServiceRole } from "./lib/stagingGuard.mjs";

const DEMO_DOMAIN = "@staging.hybrid365.local";
const TEST_WEEK_ID = "test-week-1";
const TEST_TYPE_FOR_BENCHMARK = { run_5k: "five_k_run", ski_2k: "ski_2k", row_2k: "row_2k" };
const COACH = { id: "demo-coach", name: "Demo Coach", email: `demo-coach${DEMO_DOMAIN}`, role: "coach" };

const here = dirname(fileURLToPath(import.meta.url));
const { athletes } = JSON.parse(readFileSync(join(here, "hyrox-demo-athletes.json"), "utf8"));
const args = process.argv.slice(2);
const mode = args.includes("--reset") ? "reset" : args.includes("--login") ? "login" : args.includes("--apply") ? "apply" : "dry-run";

function clock(totalSeconds) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Only fields the fixture states or that follow arithmetically from it. RPE and splits stay empty. */
function resultJsonFor(benchmark) {
  if (benchmark.type === "run_5k") {
    return { totalTime: benchmark.display, averagePace: `${clock(benchmark.normalizedSeconds / 5)}/km` };
  }
  return { totalTime: benchmark.display, average500mSplit: clock(benchmark.normalizedSeconds / 4) };
}

function seedPlan(athlete) {
  const tests = athlete.benchmarks
    .filter((b) => b.active && TEST_TYPE_FOR_BENCHMARK[b.type])
    .map((b) => ({ test_type: TEST_TYPE_FOR_BENCHMARK[b.type], test_date: b.date, result_json: resultJsonFor(b) }));
  const skipped = athlete.benchmarks
    .filter((b) => !(b.active && TEST_TYPE_FOR_BENCHMARK[b.type]))
    .map((b) => `${b.type}${b.active ? "" : " (history)"}`);
  return { tests, skipped };
}

function assertDemoEmail(email) {
  if (!email.endsWith(DEMO_DOMAIN)) throw new GuardError(`Refusing: ${email} is not a ${DEMO_DOMAIN} demo user.`);
}

async function listDemoUsers(admin) {
  const users = [];
  for (let page = 1; page < 50; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    users.push(...data.users.filter((u) => u.email?.endsWith(DEMO_DOMAIN)));
    if (data.users.length < 200) break;
  }
  return users;
}

async function ensureUser(admin, existing, person) {
  assertDemoEmail(person.email);
  const found = existing.find((u) => u.email === person.email);
  if (found) return found;
  const { data, error } = await admin.auth.admin.createUser({
    email: person.email,
    email_confirm: true,
    user_metadata: { full_name: person.name, staging_demo: person.id },
  });
  if (error) throw new Error(`createUser ${person.email}: ${error.message}`);
  return data.user;
}

async function setProfileRole(admin, userId, role) {
  const { data, error } = await admin.from("profiles").update({ role }).eq("id", userId).select("id");
  if (error) throw new Error(`profiles role: ${error.message}`);
  if (data.length) return;
  const { error: insertError } = await admin.from("profiles").insert({ id: userId, role });
  if (insertError) throw new Error(`profiles insert: ${insertError.message}`);
}

async function seedAthlete(admin, existingUsers, athlete) {
  const user = await ensureUser(admin, existingUsers, athlete);
  await setProfileRole(admin, user.id, "athlete");

  const row = { name: athlete.name, email: athlete.email, user_id: user.id, status: "testing_submitted", payment_status: "paid" };
  const { data: current, error: findError } = await admin.from("hyrox_athletes").select("id").eq("email", athlete.email).maybeSingle();
  if (findError) throw new Error(`hyrox_athletes lookup: ${findError.message}`);
  const { data: saved, error: saveError } = current
    ? await admin.from("hyrox_athletes").update(row).eq("id", current.id).select("id").single()
    : await admin.from("hyrox_athletes").insert(row).select("id").single();
  if (saveError) throw new Error(`hyrox_athletes save: ${saveError.message}`);
  const athleteId = saved.id;

  const { tests, skipped } = seedPlan(athlete);
  await admin.from("hyrox_performance_test_results").delete().eq("athlete_id", athleteId).eq("test_week_id", TEST_WEEK_ID);
  if (tests.length) {
    const { error } = await admin.from("hyrox_performance_test_results").insert(
      tests.map((t) => ({ ...t, athlete_id: athleteId, test_week_id: TEST_WEEK_ID, status: "submitted" }))
    );
    if (error) throw new Error(`performance tests: ${error.message}`);
  }

  await admin.from("hyrox_race_results").delete().eq("athlete_id", athleteId);
  if (athlete.race) {
    const { error } = await admin.from("hyrox_race_results").insert({
      athlete_id: athleteId,
      race_event: "HYROX (staging demo history)",
      race_date: athlete.race.date,
      category: athlete.race.division,
      total_time: athlete.race.display,
    });
    if (error) throw new Error(`race result: ${error.message}`);
  }

  console.log(`  seeded   ${athlete.id}: tests ${tests.map((t) => t.test_type).join(", ") || "none"}; race ${athlete.race ? "history" : "none"}; skipped ${skipped.join(", ") || "none"}`);
}

async function reset(admin) {
  const { data: rows, error } = await admin.from("hyrox_athletes").select("id, email").like("email", `%${DEMO_DOMAIN}`);
  if (error) throw new Error(`hyrox_athletes lookup: ${error.message}`);
  for (const row of rows) {
    assertDemoEmail(row.email);
    const { error: deleteError } = await admin.from("hyrox_athletes").delete().eq("id", row.id);
    if (deleteError) throw new Error(`delete ${row.email}: ${deleteError.message}`);
  }
  const users = await listDemoUsers(admin);
  for (const user of users) {
    assertDemoEmail(user.email);
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(`delete user ${user.email}: ${deleteError.message}`);
  }
  console.log(`Reset: removed ${rows.length} demo athlete rows and ${users.length} demo auth users.`);
}

async function loginLink(admin, env, id) {
  const person = [...athletes, COACH].find((p) => p.id === id);
  if (!person) throw new GuardError(`Unknown demo id. Use one of: ${[...athletes, COACH].map((p) => p.id).join(", ")}`);
  assertDemoEmail(person.email);
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: person.email });
  if (error) throw new Error(`generateLink: ${error.message}`);
  const site = (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const portal = person.role === "coach" ? "community" : "athlete";
  const next = person.role === "coach" ? "/admin/hyrox-athletes" : "/athlete/dashboard";
  const url = new URL(`${site}/auth/callback`);
  url.searchParams.set("portal", portal);
  url.searchParams.set("next", next);
  url.searchParams.set("token_hash", data.properties.hashed_token);
  url.searchParams.set("type", "magiclink");
  console.log(`One-time staging sign-in for ${person.email} (expires after first use):\n${url}`);
}

async function main() {
  const env = loadLocalEnv();
  assertStagingTarget(env, { needServiceRole: true });

  if (mode === "dry-run") {
    console.log("Dry run against hybrid365-staging (no writes). Re-run with --apply to seed.");
    for (const athlete of athletes) {
      const { tests, skipped } = seedPlan(athlete);
      console.log(`  ${athlete.id} <${athlete.email}>: tests ${tests.map((t) => `${t.test_type} ${t.result_json.totalTime}`).join(", ")}; race ${athlete.race ? `${athlete.race.display} history` : "none"}; skipped ${skipped.join(", ") || "none"}`);
    }
    console.log(`  ${COACH.id} <${COACH.email}>: profile role coach`);
    return;
  }

  await proveStagingServiceRole(env);
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (mode === "reset") return reset(admin);
  if (mode === "login") return loginLink(admin, env, args[args.indexOf("--login") + 1]);

  const existing = await listDemoUsers(admin);
  for (const athlete of athletes) await seedAthlete(admin, existing, athlete);
  const coach = await ensureUser(admin, existing, COACH);
  await setProfileRole(admin, coach.id, "coach");
  console.log(`  seeded   ${COACH.id}: profile role coach`);
}

main().catch((error) => {
  console.error(error instanceof GuardError ? error.message : `Failed: ${error.message}`);
  process.exit(1);
});
