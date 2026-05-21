import type { BenchmarkSubmission, BenchmarkTestId } from "@/app/athlete/testing/hyroxTestingTypes";
import { benchmarkKindForTestId } from "@/app/athlete/testing/hyroxTestingTypes";
import type { BenchmarkSnapshotItem } from "@/app/lib/dashboardWeekTracking";
import type { HyroxTestingResultRow } from "@/app/lib/hyroxDatabaseTypes";

const TEST_ID_BY_DB_TYPE: Partial<Record<string, BenchmarkTestId>> = {
  five_k_run: "5k",
  one_k_ski: "ski",
  two_k_row: "row2k",
  mini_compromised: "compromised",
  farmer_hold: "farmer_hold",
  sandbag_lunge_capacity: "sandbag_lunge",
  wall_ball_capacity: "wall_ball",
  sled_exposure: "sled_exposure",
};

/** Dashboard snapshot order — matches athlete testing flow labels. */
export const ATHLETE_SNAPSHOT_BENCHMARKS: Array<{ id: BenchmarkTestId; label: string }> = [
  { id: "5k", label: "5km Run" },
  { id: "ski", label: "1km SkiErg" },
  { id: "row2k", label: "2km Row" },
  { id: "compromised", label: "Mini Compromised" },
  { id: "wall_ball", label: "Wall Balls" },
  { id: "sandbag_lunge", label: "Sandbag Lunges" },
  { id: "farmer_hold", label: "Farmer Hold" },
  { id: "sled_exposure", label: "Sled Exposure" },
];

function parseTimeToSeconds(value: string): number | null {
  const t = value.trim();
  if (!t) return null;
  const parts = t.split(":").map((p) => parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 1) return parts[0]!;
  return null;
}

function formatChangeLabel(
  testId: BenchmarkTestId,
  latestRaw: string,
  previousRaw: string
): string | null {
  if (!latestRaw || !previousRaw || latestRaw === previousRaw) return null;

  const timeIds: BenchmarkTestId[] = ["5k", "ski", "row2k", "compromised"];
  if (timeIds.includes(testId)) {
    const latest = parseTimeToSeconds(latestRaw);
    const prev = parseTimeToSeconds(previousRaw);
    if (latest == null || prev == null) return null;
    const delta = prev - latest;
    if (delta === 0) return null;
    const secs = Math.abs(delta);
    return delta > 0 ? `${secs}s faster` : `${secs}s slower`;
  }

  const latestNum = parseFloat(latestRaw.replace(/[^\d.]/g, ""));
  const prevNum = parseFloat(previousRaw.replace(/[^\d.]/g, ""));
  if (Number.isNaN(latestNum) || Number.isNaN(prevNum)) return null;
  const diff = latestNum - prevNum;
  if (diff === 0) return null;
  const unit = latestRaw.includes("m") && !latestRaw.includes("min") ? "m" : " reps";
  return diff > 0 ? `+${diff}${unit}` : `${diff}${unit}`;
}

export function formatBenchmarkSubmissionDisplay(
  submission: BenchmarkSubmission | Record<string, unknown>
): string {
  const sub = submission as BenchmarkSubmission & Record<string, unknown>;
  switch (sub.kind) {
    case "run_5k":
    case "erg_ski_1k":
    case "erg_row_2k":
      return (sub.resultTime as string)?.trim() || "Submitted";
    case "mini_compromised":
      return (sub.totalTime as string)?.trim() || "Submitted";
    case "farmer_hold":
      return (sub.totalHoldTime as string)?.trim() || "Submitted";
    case "sandbag_lunge":
      return (sub.totalMetres4Min as string)?.trim()
        ? `${sub.totalMetres4Min} m`
        : "Submitted";
    case "wall_ball":
      return (sub.repsCompleted as string)?.trim()
        ? `${sub.repsCompleted} ub`
        : (sub.totalTime as string)?.trim() || "Submitted";
    case "sled_exposure":
      return (sub.notes as string)?.trim() || "Logged";
    default: {
      const raw = sub as Record<string, unknown>;
      if (raw.totalTime) return String(raw.totalTime);
      if (raw.time) return String(raw.time);
      if (raw.resultTime) return String(raw.resultTime);
      return "Submitted";
    }
  }
}

function submissionFromRow(row: HyroxTestingResultRow): BenchmarkSubmission | null {
  const result = row.result as BenchmarkSubmission | null;
  if (result?.kind) return result;
  const testId = TEST_ID_BY_DB_TYPE[row.test_type];
  if (!testId) return null;
  return { ...(row.result as Record<string, unknown>), kind: benchmarkKindForTestId(testId) } as BenchmarkSubmission;
}

export function groupTestingRowsByBenchmark(
  tests: HyroxTestingResultRow[]
): Record<BenchmarkTestId, HyroxTestingResultRow[]> {
  const grouped: Partial<Record<BenchmarkTestId, HyroxTestingResultRow[]>> = {};
  for (const row of tests) {
    const testId = TEST_ID_BY_DB_TYPE[row.test_type];
    if (!testId) continue;
    if (!grouped[testId]) grouped[testId] = [];
    grouped[testId]!.push(row);
  }
  for (const id of Object.keys(grouped) as BenchmarkTestId[]) {
    grouped[id]!.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
  return grouped as Record<BenchmarkTestId, HyroxTestingResultRow[]>;
}

export function buildAthleteBenchmarkSnapshot(tests: HyroxTestingResultRow[]): BenchmarkSnapshotItem[] {
  const grouped = groupTestingRowsByBenchmark(tests);

  return ATHLETE_SNAPSHOT_BENCHMARKS.map(({ id, label }) => {
    const rows = grouped[id];
    if (!rows?.length) {
      return { label, latest: "Not logged yet", change: null, logged: false };
    }
    const latestRow = rows[0]!;
    const previousRow = rows[1];
    const latestSub = submissionFromRow(latestRow);
    if (!latestSub) {
      return { label, latest: "Not logged yet", change: null, logged: false };
    }
    const latest = formatBenchmarkSubmissionDisplay(latestSub);
    const previous = previousRow
      ? formatBenchmarkSubmissionDisplay(submissionFromRow(previousRow)!)
      : null;
    const change = previous ? formatChangeLabel(id, latest, previous) : null;
    return { label, latest, change, logged: true };
  });
}
