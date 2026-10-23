import {
  BenchmarkMathError,
  ERG_1K_METRES,
  ERG_2K_METRES,
  RUN_10K_KM,
  RUN_5K_KM,
  ergSplitSecondsPer500,
  formatDuration,
  formatPacePerKm,
  formatSplitPer500,
  formatWatts,
  paceFromThirtyMinuteTest,
  parseClockToSeconds,
  parsePaceToSeconds,
  parsePositiveNumber,
  runPaceSecondsPerKm,
} from "@/app/lib/hyroxBenchmarkMath";

export const BENCHMARK_TYPES = [
  "run_5k",
  "run_10k",
  "run_30min",
  "threshold_pace",
  "hyrox_run_pace",
  "ski_1k",
  "ski_2k",
  "row_2k",
  "ftp",
  "hyrox_race",
  "squat",
  "deadlift",
  "bench",
  "military_press",
] as const;

export type BenchmarkType = (typeof BENCHMARK_TYPES)[number];

export const BENCHMARK_SOURCES = [
  "athlete_submitted",
  "coach_entered",
  "onboarding_test",
  "performance_test",
  "race_result",
  "lab_test",
  "imported",
] as const;

export type BenchmarkSource = (typeof BENCHMARK_SOURCES)[number];

export const BENCHMARK_STATUSES = ["pending", "approved", "rejected", "historical"] as const;

export type BenchmarkStatus = (typeof BENCHMARK_STATUSES)[number];

export const ATHLETE_SUBMIT_TYPES: BenchmarkType[] = [
  "run_5k",
  "run_10k",
  "run_30min",
  "ski_2k",
  "row_2k",
  "ftp",
  "hyrox_race",
  "squat",
  "deadlift",
  "bench",
  "military_press",
];

export const COACH_ENTRY_TYPES: BenchmarkType[] = [
  ...ATHLETE_SUBMIT_TYPES,
  "threshold_pace",
  "hyrox_run_pace",
];

export const PROGRAMMING_READINESS_TYPES: BenchmarkType[] = [
  "run_5k",
  "threshold_pace",
  "ski_2k",
  "row_2k",
  "ftp",
  "hyrox_run_pace",
];

export const STALE_BENCHMARK_DAYS = 84;

export type HyroxAthleteBenchmarkRow = {
  id: string;
  athlete_id: string;
  benchmark_type: BenchmarkType;
  result_value: string;
  result_unit: string;
  normalized_value: number;
  normalized_unit: string;
  derived_value: number | null;
  derived_unit: string | null;
  result_date: string;
  source: BenchmarkSource;
  status: BenchmarkStatus;
  active_for_programming: boolean;
  context: BenchmarkContext;
  notes: string | null;
  source_table: string | null;
  source_id: string | null;
  idempotency_key: string | null;
  submitted_by_user_id: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BenchmarkContext = {
  avgHr?: number | null;
  maxHr?: number | null;
  thresholdHr?: number | null;
  environment?: string | null;
  protocol?: string | null;
  division?: string | null;
  eventName?: string | null;
  runPace?: string | null;
  reps?: 1 | 3 | 5 | null;
  distanceKm?: number | null;
};

export type NormalizedBenchmark = {
  benchmarkType: BenchmarkType;
  resultValue: string;
  resultUnit: string;
  normalizedValue: number;
  normalizedUnit: string;
  derivedValue: number | null;
  derivedUnit: string | null;
  resultDate: string;
  context: BenchmarkContext;
  notes: string | null;
};

export type BenchmarkDraftInput = {
  benchmarkType: BenchmarkType;
  time?: string;
  pace?: string;
  distanceKm?: string;
  watts?: string;
  loadKg?: string;
  reps?: string;
  date: string;
  avgHr?: string;
  maxHr?: string;
  thresholdHr?: string;
  environment?: string;
  protocol?: string;
  division?: string;
  eventName?: string;
  runPace?: string;
  notes?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isBenchmarkType(value: string): value is BenchmarkType {
  return (BENCHMARK_TYPES as readonly string[]).includes(value);
}

export function benchmarkLabel(type: BenchmarkType): string {
  switch (type) {
    case "run_5k":
      return "5K";
    case "run_10k":
      return "10K";
    case "run_30min":
      return "30-min run";
    case "threshold_pace":
      return "Threshold";
    case "hyrox_run_pace":
      return "HYROX run pace";
    case "ski_1k":
      return "1K Ski";
    case "ski_2k":
      return "2K Ski";
    case "row_2k":
      return "2K Row";
    case "ftp":
      return "FTP";
    case "hyrox_race":
      return "HYROX";
    case "squat":
      return "Squat";
    case "deadlift":
      return "Deadlift";
    case "bench":
      return "Bench";
    case "military_press":
      return "Military press";
    default:
      return type;
  }
}

export function benchmarkFamily(type: BenchmarkType): "Running" | "Ergs" | "Bike" | "HYROX" | "Strength" {
  if (
    type === "run_5k" ||
    type === "run_10k" ||
    type === "run_30min" ||
    type === "threshold_pace" ||
    type === "hyrox_run_pace"
  ) {
    return "Running";
  }
  if (type === "ski_1k" || type === "ski_2k" || type === "row_2k") return "Ergs";
  if (type === "ftp") return "Bike";
  if (type === "hyrox_race") return "HYROX";
  return "Strength";
}

function optionalHr(raw: string | undefined, label: string): number | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 30 || value > 230) {
    throw new BenchmarkMathError(`${label} should be a heart rate between 30 and 230.`);
  }
  return value;
}

function requireDate(raw: string): string {
  const date = raw.trim();
  if (!DATE_RE.test(date)) throw new BenchmarkMathError("Enter the result date.");
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new BenchmarkMathError("Enter a valid result date.");
  return date;
}

function cleanNotes(raw: string | undefined): string | null {
  const notes = raw?.trim() ?? "";
  return notes || null;
}

export function normalizeBenchmarkInput(input: BenchmarkDraftInput): NormalizedBenchmark {
  const resultDate = requireDate(input.date);
  const notes = cleanNotes(input.notes);
  const type = input.benchmarkType;

  if (type === "run_5k" || type === "run_10k") {
    const seconds = parseClockToSeconds(input.time ?? "");
    const km = type === "run_5k" ? RUN_5K_KM : RUN_10K_KM;
    return {
      benchmarkType: type,
      resultValue: formatDuration(seconds),
      resultUnit: "seconds",
      normalizedValue: seconds,
      normalizedUnit: "seconds",
      derivedValue: runPaceSecondsPerKm(seconds, km),
      derivedUnit: "sec_per_km",
      resultDate,
      notes,
      context: {
        avgHr: optionalHr(input.avgHr, "Average HR"),
        maxHr: optionalHr(input.maxHr, "Max HR"),
        environment: input.environment?.trim() || null,
      },
    };
  }

  if (type === "run_30min") {
    const distanceKm = parsePositiveNumber(input.distanceKm ?? "", "Distance");
    return {
      benchmarkType: type,
      resultValue: String(Math.round(distanceKm * 100) / 100),
      resultUnit: "km",
      normalizedValue: distanceKm,
      normalizedUnit: "km",
      derivedValue: paceFromThirtyMinuteTest(distanceKm),
      derivedUnit: "sec_per_km",
      resultDate,
      notes,
      context: {
        avgHr: optionalHr(input.avgHr, "Average HR"),
        maxHr: optionalHr(input.maxHr, "Max HR"),
        distanceKm,
        environment: input.environment?.trim() || null,
      },
    };
  }

  if (type === "threshold_pace" || type === "hyrox_run_pace") {
    const pace = parsePaceToSeconds(input.pace ?? "");
    return {
      benchmarkType: type,
      resultValue: formatPacePerKm(pace),
      resultUnit: "sec_per_km",
      normalizedValue: pace,
      normalizedUnit: "sec_per_km",
      derivedValue: pace,
      derivedUnit: "sec_per_km",
      resultDate,
      notes,
      context: {
        thresholdHr: type === "threshold_pace" ? optionalHr(input.thresholdHr, "Threshold HR") : null,
      },
    };
  }

  if (type === "ski_1k" || type === "ski_2k" || type === "row_2k") {
    const seconds = parseClockToSeconds(input.time ?? "");
    const metres = type === "ski_1k" ? ERG_1K_METRES : ERG_2K_METRES;
    return {
      benchmarkType: type,
      resultValue: formatDuration(seconds),
      resultUnit: "seconds",
      normalizedValue: seconds,
      normalizedUnit: "seconds",
      derivedValue: ergSplitSecondsPer500(seconds, metres),
      derivedUnit: "sec_per_500m",
      resultDate,
      notes,
      context: {
        avgHr: optionalHr(input.avgHr, "Average HR"),
        maxHr: optionalHr(input.maxHr, "Max HR"),
      },
    };
  }

  if (type === "ftp") {
    const watts = parsePositiveNumber(input.watts ?? "", "FTP");
    return {
      benchmarkType: type,
      resultValue: String(Math.round(watts)),
      resultUnit: "watts",
      normalizedValue: watts,
      normalizedUnit: "watts",
      derivedValue: null,
      derivedUnit: null,
      resultDate,
      notes,
      context: { protocol: input.protocol?.trim() || null },
    };
  }

  if (type === "hyrox_race") {
    const seconds = parseClockToSeconds(input.time ?? "");
    return {
      benchmarkType: type,
      resultValue: formatDuration(seconds, { forceHours: seconds >= 3600 }),
      resultUnit: "seconds",
      normalizedValue: seconds,
      normalizedUnit: "seconds",
      derivedValue: null,
      derivedUnit: null,
      resultDate,
      notes,
      context: {
        division: input.division?.trim() || null,
        eventName: input.eventName?.trim() || null,
        runPace: input.runPace?.trim() || null,
      },
    };
  }

  const loadKg = parsePositiveNumber(input.loadKg ?? "", "Load");
  const reps = Number(input.reps);
  if (reps !== 1 && reps !== 3 && reps !== 5) {
    throw new BenchmarkMathError("Strength benchmarks use a 1, 3 or 5 rep max.");
  }
  return {
    benchmarkType: type,
    resultValue: String(Math.round(loadKg * 10) / 10),
    resultUnit: "kg",
    normalizedValue: loadKg,
    normalizedUnit: "kg",
    derivedValue: null,
    derivedUnit: null,
    resultDate,
    notes,
    context: { reps },
  };
}

export function formatBenchmarkPrimary(row: {
  benchmarkType: BenchmarkType;
  resultValue: string;
  normalizedValue: number;
  normalizedUnit: string;
}): string {
  if (row.benchmarkType === "ftp") return formatWatts(row.normalizedValue);
  if (row.benchmarkType === "run_30min") return `${row.resultValue} km`;
  if (row.normalizedUnit === "kg") {
    return `${row.resultValue} kg`;
  }
  if (row.benchmarkType === "threshold_pace" || row.benchmarkType === "hyrox_run_pace") {
    return formatPacePerKm(row.normalizedValue);
  }
  if (row.normalizedUnit === "seconds") {
    return formatDuration(row.normalizedValue, {
      forceHours: row.benchmarkType === "hyrox_race" && row.normalizedValue >= 3600,
    });
  }
  return row.resultValue;
}

export function presentBenchmark(row: HyroxAthleteBenchmarkRow): { primary: string; derived: string | null; label: string } {
  return {
    label: benchmarkLabel(row.benchmark_type),
    primary: formatBenchmarkPrimary({
      benchmarkType: row.benchmark_type,
      resultValue: row.result_value,
      normalizedValue: row.normalized_value,
      normalizedUnit: row.normalized_unit,
    }),
    derived: formatBenchmarkDerived({
      benchmarkType: row.benchmark_type,
      derivedValue: row.derived_value,
      derivedUnit: row.derived_unit,
      context: row.context,
    }),
  };
}

export function formatBenchmarkDerived(row: {
  benchmarkType: BenchmarkType;
  derivedValue: number | null;
  derivedUnit: string | null;
  context?: BenchmarkContext | null;
}): string | null {
  if (row.derivedValue == null || !row.derivedUnit) {
    if (row.benchmarkType === "hyrox_race") return row.context?.division?.trim() || null;
    if (row.context?.reps) return `${row.context.reps}RM`;
    return null;
  }
  if (row.derivedUnit === "sec_per_km") return formatPacePerKm(row.derivedValue);
  if (row.derivedUnit === "sec_per_500m") return formatSplitPer500(row.derivedValue);
  return null;
}

export function benchmarkAgeDays(resultDate: string, today = new Date()): number | null {
  if (!DATE_RE.test(resultDate)) return null;
  const result = new Date(`${resultDate}T00:00:00Z`);
  const current = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Math.round((current.getTime() - result.getTime()) / 86_400_000);
}

export function benchmarkAgeLabel(resultDate: string, today = new Date()): string | null {
  const days = benchmarkAgeDays(resultDate, today);
  if (days == null || days < 0) return null;
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 14) return `Updated ${days} days ago`;
  const weeks = Math.round(days / 7);
  if (days < STALE_BENCHMARK_DAYS) return `Updated ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  return `${days} days old`;
}
