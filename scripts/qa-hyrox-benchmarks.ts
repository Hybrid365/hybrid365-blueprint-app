/**
 * QA: HYROX performance profile phase 1 — parsing, derived values, approval, history.
 * Run: npx tsx scripts/qa-hyrox-benchmarks.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createHyroxAdminAthletePreviewToken,
  getAdminAthletePreviewMutationBlock,
} from "../app/lib/hyroxAdminAthletePreview";
import { HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE } from "../app/lib/hyroxAdminAthletePreviewPaths";
import {
  draftFromOnboardingSubmission,
  draftFromPerformanceTest,
  draftFromRace,
} from "../app/lib/hyroxBenchmarkIngest";
import {
  BenchmarkMathError,
  ergSplitSecondsPer500,
  formatDuration,
  formatPacePerKm,
  formatSplitPer500,
  formatWatts,
  parseClockToSeconds,
  runPaceSecondsPerKm,
} from "../app/lib/hyroxBenchmarkMath";
import { buildHyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import {
  benchmarkAgeLabel,
  normalizeBenchmarkInput,
  type BenchmarkType,
} from "../app/lib/hyroxBenchmarkTypes";
import { isHyroxPerformanceProfileEnabled } from "../app/lib/hyrox-team/modules/performanceProfile/featureFlag";
import { linkedIdempotencyKey, submissionIdempotencyKey } from "../app/lib/hyroxAthleteBenchmarkServer";
import {
  applyBenchmarkCoachAction,
  assertSingleActivePerType,
  BenchmarkWorkflowError,
  type BenchmarkWorkflowRow,
} from "../app/lib/hyroxBenchmarkWorkflow";
import type { BenchmarkSubmission } from "../app/athlete/testing/hyroxTestingTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, message: string) {
  if (!cond) throw new Error(message);
}

function throws(fn: () => unknown) {
  try {
    fn();
    return false;
  } catch (error) {
    return error instanceof BenchmarkMathError || error instanceof BenchmarkWorkflowError;
  }
}

assert(parseClockToSeconds("17:42") === 1062, "17:42");
assert(parseClockToSeconds("36:50") === 2210, "36:50");
assert(parseClockToSeconds("7:18") === 438, "7:18");
assert(parseClockToSeconds("6:54") === 414, "6:54");
assert(parseClockToSeconds("59:42") === 3582, "59:42");
assert(parseClockToSeconds("1:04:14") === 3854, "1:04:14");
ok("parses 5K, 10K, ski, row and HYROX times");

for (const bad of ["", "0:00", "-1:00", "abc", "17", "1:60:00", "17:60"]) {
  assert(throws(() => parseClockToSeconds(bad)), `rejects ${bad || "empty"}`);
}
ok("rejects invalid, zero and negative times");

assert(Math.abs(runPaceSecondsPerKm(1062, 5) - 212.4) < 0.001, "5k pace");
assert(formatPacePerKm(212.4) === "3:32.4/km", "pace format");
assert(Math.abs(ergSplitSecondsPer500(438, 2000) - 109.5) < 0.001, "ski split");
assert(formatSplitPer500(109.5) === "1:49.5/500m", "split format");
assert(formatDuration(3854, { forceHours: true }) === "1:04:14", "race clock");
assert(formatWatts(320) === "320 W", "watts");
ok("derives and formats pace, split and watts");

const five = normalizeBenchmarkInput({ benchmarkType: "run_5k", time: "17:42", date: "2026-10-12" });
assert(five.normalizedValue === 1062 && five.derivedUnit === "sec_per_km", "normalized 5k");
const ftp = normalizeBenchmarkInput({ benchmarkType: "ftp", watts: "320", date: "2026-10-12" });
assert(ftp.normalizedValue === 320 && ftp.normalizedUnit === "watts" && ftp.derivedValue == null, "ftp not inferred");
const threshold = normalizeBenchmarkInput({
  benchmarkType: "threshold_pace",
  pace: "3:40/km",
  date: "2026-10-12",
  thresholdHr: "172",
});
assert(threshold.normalizedValue === 220 && threshold.context.thresholdHr === 172, "manual threshold");
ok("normalizes 5K, FTP and coach-entered threshold without estimation");

function row(id: string, type: BenchmarkType, status: BenchmarkWorkflowRow["status"], active = false): BenchmarkWorkflowRow {
  return { id, athleteId: "a1", benchmarkType: type, status, activeForProgramming: active };
}

let rows = [row("old", "run_5k", "approved", true), row("new", "run_5k", "pending")];
rows = applyBenchmarkCoachAction(rows, "new", "approve");
assert(rows.find((item) => item.id === "new")?.status === "approved", "approved");
assert(rows.find((item) => item.id === "new")?.activeForProgramming === false, "approve does not activate");
assert(rows.find((item) => item.id === "old")?.activeForProgramming === true, "previous active stays");
ok("pending result can be approved without becoming active");

rows = applyBenchmarkCoachAction(
  [row("old", "run_5k", "approved", true), row("new", "run_5k", "pending")],
  "new",
  "approve_and_activate"
);
assert(rows.filter((item) => item.activeForProgramming).length === 1, "one active");
assert(rows.find((item) => item.id === "new")?.activeForProgramming === true, "new active");
assert(rows.find((item) => item.id === "old")?.activeForProgramming === false, "old inactive");
assertSingleActivePerType(rows);
ok("approve and activate keeps one programming benchmark");

rows = applyBenchmarkCoachAction([row("new", "run_5k", "pending")], "new", "reject");
assert(rows[0]?.status === "rejected" && rows[0]?.activeForProgramming === false, "rejected");
assert(throws(() => applyBenchmarkCoachAction(rows, "new", "make_active")), "rejected cannot activate");
rows = applyBenchmarkCoachAction([row("kept", "run_5k", "approved", true)], "kept", "mark_historical");
assert(rows[0]?.status === "historical" && !rows[0]?.activeForProgramming, "historical");
ok("reject and historical never stay active");

const link = { sourceTable: "hyrox_performance_test_results", sourceId: "11111111-1111-4111-8111-111111111111" };
const sameValueLater = normalizeBenchmarkInput({ benchmarkType: "run_5k", time: "17:42", date: "2026-10-20" });
const sameValueEarlier = normalizeBenchmarkInput({ benchmarkType: "run_5k", time: "17:42", date: "2026-09-01" });
assert(linkedIdempotencyKey(link, five) === linkedIdempotencyKey(link, { ...five }), "same linked save reuses its key");
assert(
  linkedIdempotencyKey(link, five) ===
    "hyrox_performance_test_results:11111111-1111-4111-8111-111111111111:run_5k:1062:2026-10-12",
  "linked key format"
);
assert(linkedIdempotencyKey(link, sameValueLater) !== linkedIdempotencyKey(link, sameValueEarlier), "same value on another date is a new result");
assert(
  linkedIdempotencyKey(link, five) !==
    linkedIdempotencyKey({ ...link, sourceId: "22222222-2222-4222-8222-222222222222" }, five),
  "same value from another source record is a new result"
);
const changed = normalizeBenchmarkInput({ benchmarkType: "run_5k", time: "18:02", date: "2026-10-12" });
assert(linkedIdempotencyKey(link, changed) !== linkedIdempotencyKey(link, five), "edited value is a new result");
ok("linked results are deduplicated by source identity, never by value alone");

const formKey = "6F1C2D3E-4A5B-4C6D-8E7F-901234567890";
assert(submissionIdempotencyKey("athlete", formKey) === `athlete:${formKey.toLowerCase()}`, "athlete key scoped");
assert(submissionIdempotencyKey("coach", formKey) === `coach:${formKey.toLowerCase()}`, "coach key scoped");
assert(submissionIdempotencyKey("athlete", formKey) !== submissionIdempotencyKey("coach", formKey), "scopes differ");
for (const bad of [undefined, null, "", "17:42", "not-a-uuid", 42, "x".repeat(400)]) {
  assert(submissionIdempotencyKey("athlete", bad) === null, `rejects submission key ${String(bad).slice(0, 12)}`);
}
ok("form submission keys are validated and scoped");

const migration = readFileSync(join(process.cwd(), "supabase/migrations/021_hyrox_athlete_benchmarks.sql"), "utf8");
const sql = migration.replace(/--.*$/gm, "");
function policyBody(name: string): string {
  const match = sql.match(new RegExp(`create policy ${name}\\s[\\s\\S]*?;`, "i"));
  assert(match, `policy ${name} exists`);
  return match![0].replace(/\s+/g, " ");
}
const athleteInsert = policyBody("hyrox_athlete_benchmarks_athlete_insert");
for (const clause of [
  "for insert",
  "status = 'pending'",
  "active_for_programming = false",
  "source = 'athlete_submitted'",
  "submitted_by_user_id = auth.uid()",
  "approved_by_user_id is null",
  "approved_at is null",
  "source_table is null",
  "source_id is null",
  "ha.user_id = auth.uid()",
]) {
  assert(athleteInsert.includes(clause), `athlete insert policy enforces ${clause}`);
}
assert(policyBody("hyrox_athlete_benchmarks_athlete_select").includes("for select"), "athlete select only");
const policies = [...sql.matchAll(/create policy (\w+)\s+on public\.hyrox_athlete_benchmarks\s+for (\w+)/gi)].map(
  (m) => `${m[1]}:${m[2].toLowerCase()}`
);
assert(
  JSON.stringify(policies.sort()) ===
    JSON.stringify(
      [
        "hyrox_athlete_benchmarks_athlete_insert:insert",
        "hyrox_athlete_benchmarks_athlete_select:select",
        "hyrox_athlete_benchmarks_coach_insert:insert",
        "hyrox_athlete_benchmarks_coach_select:select",
        "hyrox_athlete_benchmarks_coach_update:update",
      ].sort()
    ),
  `unexpected policy set ${policies.join(", ")}`
);
assert(!/for (all|delete)\b/i.test(sql), "no FOR ALL or FOR DELETE policy");
assert(/drop policy if exists hyrox_athlete_benchmarks_coach_all/i.test(sql), "old coach FOR ALL policy is dropped");
ok("021 RLS: athletes submit pending rows for themselves only; coaches cannot delete");

assert(/idempotency_key text/i.test(sql), "idempotency column");
assert(/unique \(athlete_id, idempotency_key\)/i.test(sql), "idempotency unique per athlete");
assert(/hyrox_athlete_benchmarks_one_active_idx[\s\S]*?where active_for_programming = true/i.test(sql), "one active index kept");
ok("021 idempotency key is unique per athlete and nullable");

assert(/create or replace function public\.hyrox_activate_athlete_benchmark/i.test(sql), "activation function");
assert(/for update/i.test(sql) && /pg_advisory_xact_lock/i.test(sql), "activation locks the row and the type");
assert(/security invoker/i.test(sql), "activation does not escalate privileges");
assert(/revoke all on function public\.hyrox_activate_athlete_benchmark\([^)]*\) from public/i.test(sql), "revoked from public");
assert(/revoke all on function public\.hyrox_activate_athlete_benchmark\([^)]*\) from anon, authenticated/i.test(sql), "revoked from API roles");
assert(/grant execute on function public\.hyrox_activate_athlete_benchmark\([^)]*\) to service_role/i.test(sql), "service role only");
ok("021 activation function is atomic and server-only");

const server = readFileSync(join(process.cwd(), "app/lib/hyroxAthleteBenchmarkServer.ts"), "utf8");
assert(server.includes('rpc("hyrox_activate_athlete_benchmark"'), "server activates through the RPC");
assert(!/update\(\{\s*active_for_programming:\s*true/.test(server), "server never sets active directly");
assert(!server.includes("linkedBenchmarkUnchanged"), "no value-only dedupe");
for (const route of [
  "app/api/hyrox/athlete/benchmarks/route.ts",
  "app/api/hyrox/athletes/[id]/benchmarks/route.ts",
]) {
  const source = readFileSync(join(process.cwd(), route), "utf8");
  assert(source.includes("submissionIdempotencyKey("), `${route} uses the submission key`);
}
const athleteRoute = readFileSync(join(process.cwd(), "app/api/hyrox/athlete/benchmarks/route.ts"), "utf8");
assert(athleteRoute.includes('source: "athlete_submitted"') && athleteRoute.includes('status: "pending"') && athleteRoute.includes("makeActive: false"), "athlete route fixes source, status and active");
assert(athleteRoute.includes("auth.athlete.id") && !/body\.(athleteId|athlete_id|source|status)/.test(athleteRoute), "athlete route ignores client identity and status");
ok("server workflows use idempotency keys and atomic activation");

const profile = buildHyroxAthletePerformanceProfile([
  {
    id: "pb",
    benchmarkType: "run_5k",
    normalizedValue: 1050,
    normalizedUnit: "seconds",
    derivedValue: 210,
    derivedUnit: "sec_per_km",
    resultDate: "2024-01-01",
    source: "athlete_submitted",
    status: "approved",
    activeForProgramming: false,
    context: {},
  },
  {
    id: "current",
    benchmarkType: "run_5k",
    normalizedValue: 1082,
    normalizedUnit: "seconds",
    derivedValue: 216.4,
    derivedUnit: "sec_per_km",
    resultDate: "2026-10-12",
    source: "performance_test",
    status: "approved",
    activeForProgramming: true,
    context: {},
  },
]);
assert(profile.run5k?.benchmarkId === "current", "active 5k wins over faster historical");
assert(profile.threshold == null, "missing threshold stays null");
assert(profile.readiness.find((item) => item.type === "run_5k")?.state === "ready", "5k ready");
assert(profile.readiness.find((item) => item.type === "threshold_pace")?.state === "missing", "threshold missing");
ok("profile resolver uses the active benchmark and does not estimate");

const ski = draftFromOnboardingSubmission(
  "one_k_ski",
  {
    kind: "erg_ski_1k",
    resultTime: "3:40",
    averageSplit: "",
    strokeRate: "",
    averageHr: "",
    rpe: "",
    notes: "",
  } satisfies BenchmarkSubmission,
  "2026-10-01"
);
assert(ski?.benchmarkType === "ski_1k", "onboarding ski stays 1k");
const perf = draftFromPerformanceTest("ski_2k", { totalTime: "7:18" }, "2026-10-02");
assert(perf?.benchmarkType === "ski_2k", "performance testing 2k ski");
const race = draftFromRace({ total_time: "59:42", category: "Pro", race_event: "London" });
assert(race?.benchmarkType === "hyrox_race" && race.division === "Pro", "race history");
ok("onboarding and performance testing feed the same benchmark types without renaming");

const previous = process.env.HYROX_PERFORMANCE_PROFILE_ENABLED;
delete process.env.HYROX_PERFORMANCE_PROFILE_ENABLED;
assert(!isHyroxPerformanceProfileEnabled({ id: "athlete-1", email: "a@example.com" }), "flag default off");
process.env.HYROX_PERFORMANCE_PROFILE_ENABLED = "1";
assert(isHyroxPerformanceProfileEnabled({ id: "athlete-1", email: "a@example.com" }), "global flag");
if (previous === undefined) delete process.env.HYROX_PERFORMANCE_PROFILE_ENABLED;
else process.env.HYROX_PERFORMANCE_PROFILE_ENABLED = previous;
ok("performance profile flag stays off unless explicitly enabled");

const previewToken = createHyroxAdminAthletePreviewToken({
  coachUserId: "coach-1",
  athleteId: "athlete-1",
});
const preview = getAdminAthletePreviewMutationBlock(
  new Request("http://localhost/api/hyrox/athlete/benchmarks", {
    method: "POST",
    headers: { cookie: `${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=${previewToken}` },
  })
);
assert(preview.blocked === true, "signed preview cookie blocks athlete mutations");
assert(
  getAdminAthletePreviewMutationBlock(new Request("http://localhost/api/hyrox/athlete/benchmarks")).blocked === false,
  "normal athlete request is not preview-blocked"
);
ok("preview cookie blocks benchmark submission");

assert(benchmarkAgeLabel("2026-10-12", new Date("2026-10-12T12:00:00Z")) === "Updated today", "age today");
ok("benchmark age is a label only");

console.log(`\n${passed} benchmark checks passed.`);
