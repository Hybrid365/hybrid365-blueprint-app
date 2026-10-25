/**
 * QA: Programming Anchors — active profile only, source labels, no silent estimates.
 * Run: npx tsx scripts/qa-hyrox-programming-anchors.ts
 */

import type { HyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import { buildHyroxAthletePerformanceProfile } from "../app/lib/hyroxBenchmarkProfile";
import type { ProfileBenchmarkRow } from "../app/lib/hyroxBenchmarkProfile";
import {
  buildProgrammingAnchorsSummary,
  buildSessionPrescriptionContext,
  programmingAnchorSourceLabel,
} from "../app/lib/hyroxProgrammingAnchors";
import { STALE_BENCHMARK_DAYS } from "../app/lib/hyroxBenchmarkTypes";

let passed = 0;
function ok(name: string) {
  passed += 1;
  console.log(`✓ ${name}`);
}
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function row(
  partial: Partial<ProfileBenchmarkRow> &
    Pick<ProfileBenchmarkRow, "id" | "benchmarkType" | "normalizedValue" | "normalizedUnit">
): ProfileBenchmarkRow {
  return {
    derivedValue: null,
    derivedUnit: null,
    resultDate: "2026-10-20",
    source: "coach_entered",
    status: "approved",
    activeForProgramming: true,
    context: {},
    ...partial,
  };
}

const today = new Date("2026-10-25T12:00:00Z");

// A — full anchors
const fullRows: ProfileBenchmarkRow[] = [
  row({
    id: "t1",
    benchmarkType: "threshold_pace",
    normalizedValue: 228,
    normalizedUnit: "sec_per_km",
    source: "lab_test",
    resultDate: "2026-10-12",
  }),
  row({
    id: "5k",
    benchmarkType: "run_5k",
    normalizedValue: 1100,
    normalizedUnit: "sec",
    derivedValue: 220,
    derivedUnit: "sec_per_km",
    source: "performance_test",
    resultDate: "2026-10-10",
  }),
  row({
    id: "10k",
    benchmarkType: "run_10k",
    normalizedValue: 2290,
    normalizedUnit: "sec",
    derivedValue: 229,
    derivedUnit: "sec_per_km",
    source: "race_result",
    resultDate: "2026-09-01",
  }),
  row({
    id: "hx",
    benchmarkType: "hyrox_run_pace",
    normalizedValue: 250,
    normalizedUnit: "sec_per_km",
    source: "coach_entered",
    resultDate: "2026-10-20",
  }),
  row({
    id: "ski",
    benchmarkType: "ski_2k",
    normalizedValue: 455,
    normalizedUnit: "sec",
    derivedValue: 113.75,
    derivedUnit: "sec_per_500m",
    source: "performance_test",
  }),
  row({
    id: "row",
    benchmarkType: "row_2k",
    normalizedValue: 430,
    normalizedUnit: "sec",
    derivedValue: 107.5,
    derivedUnit: "sec_per_500m",
    source: "performance_test",
  }),
  row({
    id: "ftp",
    benchmarkType: "ftp",
    normalizedValue: 285,
    normalizedUnit: "watts",
    source: "lab_test",
  }),
];
const fullProfile = buildHyroxAthletePerformanceProfile(fullRows);
const full = buildProgrammingAnchorsSummary(fullProfile, { today });
assert(full.setCount === 7, `full setCount ${full.setCount}`);
assert(full.missingCount === 0, "full missing");
assert(full.items.find((i) => i.key === "threshold")?.primary === "3:48/km", "threshold 3:48");
assert(
  full.items.find((i) => i.key === "threshold")?.sourceLabel === "Lab tested",
  "lab label"
);
assert(
  full.items.find((i) => i.key === "hyroxRun")?.sourceLabel === "Coach estimate",
  "coach estimate label"
);
ok("A full anchors + source labels");

// B — missing threshold
const noTh = buildProgrammingAnchorsSummary(
  buildHyroxAthletePerformanceProfile(
    fullRows.filter((r) => r.benchmarkType !== "threshold_pace")
  ),
  { today }
);
const th = noTh.items.find((i) => i.key === "threshold")!;
assert(th.primary === null && th.freshness === "not_set", "threshold not set");
assert(th.sourceLabel === null, "no invented source");
ok("B missing threshold → Not set");

// C — pending athlete-submitted does NOT become active
const withPending: ProfileBenchmarkRow[] = [
  {
    ...row({
      id: "pend",
      benchmarkType: "threshold_pace",
      normalizedValue: 200,
      normalizedUnit: "sec_per_km",
      source: "athlete_submitted",
      status: "pending",
      activeForProgramming: false,
      resultDate: "2026-10-24",
    }),
  },
  ...fullRows.filter((r) => r.benchmarkType !== "threshold_pace"),
];
const pendingProfile = buildHyroxAthletePerformanceProfile(withPending);
assert(pendingProfile.threshold === null, "pending not active");
const pendingSummary = buildProgrammingAnchorsSummary(pendingProfile, { today });
assert(
  pendingSummary.items.find((i) => i.key === "threshold")?.freshness === "not_set",
  "pending excluded from anchors"
);
ok("C pending athlete-submitted does not replace active");

// D — coach estimate
assert(programmingAnchorSourceLabel("coach_entered") === "Coach estimate", "D label");
const coachEst = buildProgrammingAnchorsSummary(
  buildHyroxAthletePerformanceProfile([
    row({
      id: "ce",
      benchmarkType: "threshold_pace",
      normalizedValue: 230,
      normalizedUnit: "sec_per_km",
      source: "coach_entered",
      resultDate: "2026-10-25",
    }),
  ]),
  { today }
);
assert(
  coachEst.items.find((i) => i.key === "threshold")?.sourceLabel === "Coach estimate",
  "D coach estimate on item"
);
assert(coachEst.items.find((i) => i.key === "threshold")?.primary === "3:50/km", "D 3:50");
ok("D coach-estimated threshold");

// E — lab tested
assert(programmingAnchorSourceLabel("lab_test") === "Lab tested", "E label");
ok("E lab-tested source label");

// F — Builder uses same active profile values as Performance Profile resolver
const builderView = buildProgrammingAnchorsSummary(fullProfile, { today, includeRun10k: false });
assert(
  builderView.items.find((i) => i.key === "threshold")?.primary ===
    (fullProfile.threshold ? "3:48/km" : null),
  "F same threshold"
);
assert(
  builderView.items.find((i) => i.key === "ftp")?.primary ===
    (fullProfile.ftp ? "285 W" : null),
  "F same FTP"
);
ok("F Programme Builder summary matches active profile");

// G — suggested target from anchor (+5s)
const ctxG = buildSessionPrescriptionContext({
  profile: fullProfile,
  sessionFamily: {
    familyName: "Threshold — 5 Minute Repeats",
    stageLabel: "Stage 2",
    prescriptionPreview: {
      slots: [
        {
          slot: "run",
          expression: "@THRESHOLD +5s/km",
          resolvedValue: 233,
          source: "formula",
        },
      ],
    },
  },
  editConfig: { kind: "threshold_run" },
});
assert(ctxG?.anchorValue === "3:48/km", "G anchor");
assert(ctxG?.ruleExpression === "@THRESHOLD +5s/km", "G rule");
assert(ctxG?.suggestedTarget === "3:53/km", "G suggested 3:53");
assert(ctxG?.missingAnchorWarning === null, "G no warning");
ok("G session suggested target from anchor");

// H — coach fixed target overrides display; formula preserved
const ctxH = buildSessionPrescriptionContext({
  profile: fullProfile,
  sessionFamily: {
    familyName: "Threshold — 5 Minute Repeats",
    prescriptionPreview: {
      slots: [
        {
          slot: "run",
          expression: "@THRESHOLD +5s/km",
          resolvedValue: 233,
          source: "formula",
        },
      ],
    },
  },
  editConfig: { kind: "threshold_run", targetPaceLoad: "3:50/km" },
});
assert(ctxH?.suggestedTarget === "3:53/km", "H suggested retained");
assert(ctxH?.coachFixedTarget === "3:50/km", "H coach fixed");
assert(ctxH?.ruleExpression === "@THRESHOLD +5s/km", "H rule retained");
ok("H coach fixed target distinct from formula");

// I — historical / non-active does not replace
const historicalOnly = buildHyroxAthletePerformanceProfile([
  row({
    id: "hist",
    benchmarkType: "threshold_pace",
    normalizedValue: 210,
    normalizedUnit: "sec_per_km",
    status: "historical",
    activeForProgramming: false,
    source: "lab_test",
  }),
  row({
    id: "active",
    benchmarkType: "threshold_pace",
    normalizedValue: 228,
    normalizedUnit: "sec_per_km",
    source: "coach_entered",
    resultDate: "2026-10-20",
  }),
]);
assert(historicalOnly.threshold?.paceSecondsPerKm === 228, "I active wins");
assert(historicalOnly.threshold?.source === "coach_entered", "I not historical lab");
ok("I historical does not replace active");

// Staleness uses date transparency (84 days)
const staleDate = new Date(today);
staleDate.setUTCDate(staleDate.getUTCDate() - (STALE_BENCHMARK_DAYS + 5));
const staleYmd = staleDate.toISOString().slice(0, 10);
const staleSummary = buildProgrammingAnchorsSummary(
  buildHyroxAthletePerformanceProfile([
    row({
      id: "stale",
      benchmarkType: "threshold_pace",
      normalizedValue: 228,
      normalizedUnit: "sec_per_km",
      source: "lab_test",
      resultDate: staleYmd,
    }),
  ]),
  { today }
);
assert(staleSummary.items.find((i) => i.key === "threshold")?.freshness === "stale", "stale");
ok("stale freshness from date (no invented score)");

// Missing-anchor session warning
const ctxMiss = buildSessionPrescriptionContext({
  profile: { ...fullProfile, threshold: null } as HyroxAthletePerformanceProfile,
  sessionFamily: {
    familyName: "Threshold",
    prescriptionPreview: {
      slots: [{ slot: "run", expression: "@THRESHOLD +5s/km", resolvedValue: null, source: "formula" }],
    },
  },
  editConfig: { kind: "threshold_run" },
});
assert(ctxMiss?.missingAnchorWarning?.includes("Threshold anchor not set"), "missing warn");
ok("missing-anchor warning for threshold session");

console.log(`\nqa-hyrox-programming-anchors: ${passed} checks passed`);
