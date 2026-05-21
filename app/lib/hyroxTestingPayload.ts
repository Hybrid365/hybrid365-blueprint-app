import {
  BENCHMARK_KIND_TO_DB_TEST_TYPE,
  type HyroxTestingResultType,
} from "@/app/lib/hyroxDatabaseTypes";
import {
  benchmarkKindForTestId,
  type BenchmarkSubmission,
  type BenchmarkTestId,
  type HyroxRaceSplitSubmission,
} from "@/app/athlete/testing/hyroxTestingTypes";

export const CORE_TEST_IDS: BenchmarkTestId[] = ["5k", "ski", "row2k", "compromised"];

export function dbTestTypeForBenchmark(submission: BenchmarkSubmission): HyroxTestingResultType {
  return BENCHMARK_KIND_TO_DB_TEST_TYPE[submission.kind] ?? "five_k_run";
}

export function dbTestTypeForTestId(testId: BenchmarkTestId): HyroxTestingResultType {
  const kind = benchmarkKindForTestId(testId);
  return BENCHMARK_KIND_TO_DB_TEST_TYPE[kind] ?? "five_k_run";
}

export function parseRpeFromSubmission(submission: BenchmarkSubmission): number | null {
  const rpe = "rpe" in submission ? Number(submission.rpe) : NaN;
  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) return null;
  return Math.round(rpe);
}

export function notesFromSubmission(submission: BenchmarkSubmission): string | null {
  const notes = "notes" in submission && typeof submission.notes === "string" ? submission.notes.trim() : "";
  return notes || null;
}

export function buildTestingResultRow(
  athleteId: string,
  testType: HyroxTestingResultType,
  submission: BenchmarkSubmission,
  testDate?: string | null
) {
  return {
    athlete_id: athleteId,
    test_type: testType,
    test_date: testDate?.trim() || null,
    result: submission,
    rpe: parseRpeFromSubmission(submission),
    notes: notesFromSubmission(submission),
    status: "submitted" as const,
  };
}

export function buildRaceResultRow(athleteId: string, race: HyroxRaceSplitSubmission) {
  return {
    athlete_id: athleteId,
    race_event: race.raceLocation?.trim() || "HYROX",
    race_date: race.raceDate?.trim() || null,
    category: race.category?.trim() || null,
    total_time: race.totalFinishTime?.trim() || null,
    bodyweight: race.bodyweightKg ? Number(race.bodyweightKg) : null,
    run_splits: race.runSplits ?? null,
    station_splits: race.stationSplits ?? null,
    weakest_station: race.worstStation?.trim() || null,
    weakest_run: race.worstRun?.trim() || null,
    biggest_limiter: race.biggestLimiter?.trim() || null,
    notes: race.raceNotes?.trim() || null,
    roxfit_screenshot_url: race.roxfitScreenshot?.trim() || null,
  };
}
