/**
 * QA: HYROX performance profile phase 1 — parsing, derived values, approval, history.
 * Run: npx tsx scripts/qa-hyrox-benchmarks.ts
 */

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
import { linkedBenchmarkUnchanged } from "../app/lib/hyroxAthleteBenchmarkServer";
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

assert(
  linkedBenchmarkUnchanged({ normalized_value: 1062, result_date: "2026-10-12" }, five) === true,
  "same result is not appended again"
);
const changed = normalizeBenchmarkInput({ benchmarkType: "run_5k", time: "18:02", date: "2026-10-20" });
assert(
  linkedBenchmarkUnchanged({ normalized_value: 1062, result_date: "2026-10-12" }, changed) === false,
  "changed result appends"
);
ok("new results do not overwrite older benchmark history");

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
