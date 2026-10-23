import type { BenchmarkSubmission } from "@/app/athlete/testing/hyroxTestingTypes";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appendLinkedBenchmark } from "@/app/lib/hyroxAthleteBenchmarkServer";
import { BenchmarkMathError } from "@/app/lib/hyroxBenchmarkMath";
import { normalizeBenchmarkInput, type BenchmarkDraftInput } from "@/app/lib/hyroxBenchmarkTypes";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function draftFromOnboardingSubmission(
  testType: string,
  submission: BenchmarkSubmission,
  testDate?: string | null
): BenchmarkDraftInput | null {
  const date = testDate?.trim() || todayDate();
  if (testType === "five_k_run" && submission.kind === "run_5k" && submission.resultTime.trim()) {
    return {
      benchmarkType: "run_5k",
      time: submission.resultTime,
      date,
      avgHr: submission.averageHr,
      maxHr: submission.maxHr,
      notes: submission.notes,
    };
  }
  if (testType === "one_k_ski" && submission.kind === "erg_ski_1k" && submission.resultTime.trim()) {
    return {
      benchmarkType: "ski_1k",
      time: submission.resultTime,
      date,
      avgHr: submission.averageHr,
      notes: submission.notes,
    };
  }
  if (testType === "two_k_row" && submission.kind === "erg_row_2k" && submission.resultTime.trim()) {
    return {
      benchmarkType: "row_2k",
      time: submission.resultTime,
      date,
      avgHr: submission.averageHr,
      notes: submission.notes,
    };
  }
  return null;
}

export function draftFromPerformanceTest(
  testType: string,
  resultJson: Record<string, unknown>,
  testDate?: string | null
): BenchmarkDraftInput | null {
  const time = typeof resultJson.totalTime === "string" ? resultJson.totalTime.trim() : "";
  if (!time) return null;
  const date = testDate?.trim() || todayDate();
  const avgHr = typeof resultJson.averageHr === "string" ? resultJson.averageHr : "";
  const maxHr = typeof resultJson.maxHr === "string" ? resultJson.maxHr : "";
  if (testType === "five_k_run") {
    return { benchmarkType: "run_5k", time, date, avgHr, maxHr };
  }
  if (testType === "ski_2k") return { benchmarkType: "ski_2k", time, date, avgHr, maxHr };
  if (testType === "row_2k") return { benchmarkType: "row_2k", time, date, avgHr, maxHr };
  return null;
}

export function draftFromRace(race: {
  total_time?: string | null;
  race_date?: string | null;
  category?: string | null;
  race_event?: string | null;
  notes?: string | null;
}): BenchmarkDraftInput | null {
  const time = race.total_time?.trim() ?? "";
  if (!time) return null;
  return {
    benchmarkType: "hyrox_race",
    time,
    date: race.race_date?.trim() || todayDate(),
    division: race.category ?? "",
    eventName: race.race_event ?? "",
    notes: race.notes ?? "",
  };
}

/** Never fail the existing testing save if benchmark history is unavailable or the value cannot be parsed. */
export async function recordLinkedBenchmarkSafely(
  client: SupabaseClient,
  athleteId: string,
  draft: BenchmarkDraftInput | null,
  link: { source: "onboarding_test" | "performance_test" | "race_result"; sourceTable: string; sourceId: string }
): Promise<void> {
  if (!draft) return;
  try {
    const normalized = normalizeBenchmarkInput(draft);
    await appendLinkedBenchmark(client, athleteId, normalized, link);
  } catch (error) {
    if (error instanceof BenchmarkMathError) {
      console.warn("[hyrox-benchmarks] skipped unparsed linked result", error.message);
      return;
    }
    console.warn("[hyrox-benchmarks] linked result was not recorded", error instanceof Error ? error.message : error);
  }
}
