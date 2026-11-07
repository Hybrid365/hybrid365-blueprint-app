import {
  presentBenchmark,
  type BenchmarkSource,
  type BenchmarkType,
  type HyroxAthleteBenchmarkRow,
} from "@/app/lib/hyroxBenchmarkTypes";
import { isLowerBetter } from "@/components/athlete-command-centre/progress/progressMath";

export type PerformanceMark = {
  row: HyroxAthleteBenchmarkRow;
  label: string;
  primary: string;
  derived: string | null;
};

export function toMark(row: HyroxAthleteBenchmarkRow): PerformanceMark {
  const shown = presentBenchmark(row);
  return {
    row,
    label: shown.label,
    primary: shown.primary,
    derived: shown.derived,
  };
}

/** Active approved programming anchors only. */
export function currentAnchors(results: HyroxAthleteBenchmarkRow[]): PerformanceMark[] {
  return results
    .filter((row) => row.active_for_programming && row.status === "approved")
    .map(toMark);
}

export function pendingMarks(results: HyroxAthleteBenchmarkRow[]): PerformanceMark[] {
  return results.filter((row) => row.status === "pending").map(toMark);
}

/**
 * Previous stored approved mark for the same type (not the active anchor).
 * Chronological: most recent approved result older than the current mark.
 */
export function findPreviousMark(
  results: HyroxAthleteBenchmarkRow[],
  current: HyroxAthleteBenchmarkRow
): PerformanceMark | null {
  const prior = results
    .filter(
      (row) =>
        row.benchmark_type === current.benchmark_type &&
        (row.status === "approved" || row.status === "historical") &&
        row.id !== current.id &&
        row.result_date.slice(0, 10) <= current.result_date.slice(0, 10)
    )
    .sort((a, b) => {
      const byDate = b.result_date.localeCompare(a.result_date);
      if (byDate !== 0) return byDate;
      return b.created_at?.localeCompare(a.created_at ?? "") ?? 0;
    });

  const older = prior.find((row) => row.result_date.slice(0, 10) < current.result_date.slice(0, 10));
  const inactive = prior.find((row) => !row.active_for_programming);
  const chosen = older ?? inactive ?? null;
  return chosen ? toMark(chosen) : null;
}

export type MarkDelta = {
  absoluteLabel: string;
  improved: boolean | null;
};

export function computeMarkDelta(
  current: HyroxAthleteBenchmarkRow,
  previous: HyroxAthleteBenchmarkRow
): MarkDelta | null {
  if (!Number.isFinite(current.normalized_value) || !Number.isFinite(previous.normalized_value)) {
    return null;
  }
  const absolute = current.normalized_value - previous.normalized_value;
  if (absolute === 0) {
    return { absoluteLabel: "Same as previous", improved: null };
  }
  const lowerBetter = isLowerBetter(current.benchmark_type);
  const improved = lowerBetter ? absolute < 0 : absolute > 0;
  return {
    absoluteLabel: formatAbsoluteDelta(current.benchmark_type, absolute, lowerBetter),
    improved,
  };
}

function formatAbsoluteDelta(type: BenchmarkType | string, delta: number, lowerBetter: boolean): string {
  const mag = Math.abs(delta);
  const sign = lowerBetter ? (delta < 0 ? "−" : "+") : delta > 0 ? "+" : "−";
  if (isLowerBetter(type)) {
    const seconds = Math.round(mag);
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${sign}${m}:${String(s).padStart(2, "0")}`;
    }
    return `${sign}${seconds}s`;
  }
  if (type === "ftp") return `${sign}${Math.round(mag)} W`;
  if (["squat", "deadlift", "bench", "military_press"].includes(type)) {
    return `${sign}${Math.round(mag * 10) / 10} kg`;
  }
  return `${sign}${Math.round(mag * 10) / 10}`;
}

/** Prefer readiness programming types that are set; else richest active mark. */
export function pickPrimaryAnchor(anchors: PerformanceMark[]): PerformanceMark | null {
  if (anchors.length === 0) return null;
  const preferred: BenchmarkType[] = [
    "run_5k",
    "threshold_pace",
    "ftp",
    "ski_2k",
    "row_2k",
    "hyrox_run_pace",
    "run_10k",
  ];
  for (const type of preferred) {
    const hit = anchors.find((mark) => mark.row.benchmark_type === type);
    if (hit) return hit;
  }
  return anchors[0] ?? null;
}

export type ModalityPanel = {
  id: string;
  label: string;
  marks: PerformanceMark[];
};

export function buildModalityPanels(anchors: PerformanceMark[]): ModalityPanel[] {
  const buckets: Array<{ id: string; label: string; types: BenchmarkType[] }> = [
    {
      id: "run",
      label: "Run",
      types: ["run_5k", "run_10k", "run_30min", "threshold_pace", "hyrox_run_pace"],
    },
    { id: "ski", label: "Ski", types: ["ski_1k", "ski_2k"] },
    { id: "row", label: "Row", types: ["row_2k"] },
    { id: "bike", label: "Bike", types: ["ftp"] },
    { id: "hyrox", label: "HYROX", types: ["hyrox_race"] },
    {
      id: "strength",
      label: "Strength",
      types: ["squat", "deadlift", "bench", "military_press"],
    },
  ];
  return buckets
    .map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      marks: anchors.filter((mark) => bucket.types.includes(mark.row.benchmark_type)),
    }))
    .filter((panel) => panel.marks.length > 0);
}

/** Athlete-safe source wording (no internal enums). */
export function athleteSourceLabel(source: BenchmarkSource | string | null | undefined): string {
  switch (source) {
    case "lab_test":
      return "Lab tested";
    case "coach_entered":
      return "Coach entered";
    case "performance_test":
      return "Performance test";
    case "onboarding_test":
      return "Onboarding test";
    case "race_result":
      return "Race result";
    case "athlete_submitted":
      return "Athlete submitted";
    case "imported":
      return "Imported";
    default:
      return "Stored result";
  }
}

export function formatMarkDate(resultDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(resultDate)) return resultDate;
  const d = new Date(`${resultDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return resultDate;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
