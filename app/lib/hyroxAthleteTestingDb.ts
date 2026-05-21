import type {
  BenchmarkSubmission,
  HyroxRaceSplitSubmission,
} from "@/app/athlete/testing/hyroxTestingTypes";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type {
  HyroxRaceResultRow,
  HyroxTestingResultRow,
  HyroxTestingResultType,
} from "@/app/lib/hyroxDatabaseTypes";
import { buildRaceResultRow, buildTestingResultRow } from "@/app/lib/hyroxTestingPayload";

export const HYROX_TESTING_SELECT =
  "id, athlete_id, created_at, updated_at, test_type, test_date, result, rpe, notes, status";

export const HYROX_RACE_SELECT =
  "id, athlete_id, created_at, updated_at, race_event, race_date, category, total_time, bodyweight, run_splits, station_splits, weakest_station, weakest_run, biggest_limiter, notes, roxfit_screenshot_url";

export async function fetchHyroxAthleteTestingRows(athleteId: string): Promise<{
  tests: HyroxTestingResultRow[];
  race: HyroxRaceResultRow | null;
  error: string | null;
}> {
  const { client } = await createCoachServerClient();

  const [{ data: tests, error: testsError }, { data: races, error: racesError }] =
    await Promise.all([
      client
        .from("hyrox_testing_results")
        .select(HYROX_TESTING_SELECT)
        .eq("athlete_id", athleteId)
        .eq("status", "submitted")
        .order("created_at", { ascending: false }),
      client
        .from("hyrox_race_results")
        .select(HYROX_RACE_SELECT)
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (testsError) {
    return { tests: [], race: null, error: testsError.message };
  }
  if (racesError) {
    return { tests: [], race: null, error: racesError.message };
  }

  return {
    tests: (tests ?? []) as HyroxTestingResultRow[],
    race: ((races ?? [])[0] as HyroxRaceResultRow | undefined) ?? null,
    error: null,
  };
}

export async function upsertHyroxTestingResult(
  athleteId: string,
  testType: HyroxTestingResultType,
  submission: BenchmarkSubmission,
  testDate?: string | null
): Promise<{ result: HyroxTestingResultRow | null; error: string | null; code?: string }> {
  const { client, mode } = await createCoachServerClient();
  const row = buildTestingResultRow(athleteId, testType, submission, testDate);

  const { data: existing, error: lookupError } = await client
    .from("hyrox_testing_results")
    .select("id")
    .eq("athlete_id", athleteId)
    .eq("test_type", testType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Hyrox testing save failed", lookupError);
    return {
      result: null,
      error: lookupError.message,
      code: lookupError.code ?? undefined,
    };
  }

  const writeError = existing?.id
    ? (
        await client.from("hyrox_testing_results").update(row).eq("id", existing.id)
      ).error
    : (await client.from("hyrox_testing_results").insert(row)).error;

  if (writeError) {
    console.error("Hyrox testing save failed", {
      message: writeError.message,
      code: writeError.code,
      details: writeError.details,
      hint: writeError.hint,
      athleteId,
      testType,
      coachSupabaseMode: mode,
    });
    return {
      result: null,
      error: writeError.message,
      code: writeError.code ?? undefined,
    };
  }

  const { data, error: fetchError } = await client
    .from("hyrox_testing_results")
    .select(HYROX_TESTING_SELECT)
    .eq("athlete_id", athleteId)
    .eq("test_type", testType)
    .eq("status", "submitted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Hyrox testing reload failed", fetchError);
    return { result: null, error: fetchError.message, code: fetchError.code ?? undefined };
  }

  return { result: (data as HyroxTestingResultRow | null) ?? null, error: null };
}

export async function upsertHyroxRaceResult(
  athleteId: string,
  race: HyroxRaceSplitSubmission
): Promise<{ race: HyroxRaceResultRow | null; error: string | null; code?: string }> {
  const { client, mode } = await createCoachServerClient();
  const row = buildRaceResultRow(athleteId, race);

  const { data: existing, error: lookupError } = await client
    .from("hyrox_race_results")
    .select("id")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    console.error("Hyrox testing save failed", lookupError);
    return { race: null, error: lookupError.message, code: lookupError.code ?? undefined };
  }

  const writeError = existing?.id
    ? (await client.from("hyrox_race_results").update(row).eq("id", existing.id)).error
    : (await client.from("hyrox_race_results").insert(row)).error;

  if (writeError) {
    console.error("Hyrox testing save failed", {
      message: writeError.message,
      code: writeError.code,
      details: writeError.details,
      hint: writeError.hint,
      athleteId,
      coachSupabaseMode: mode,
    });
    return { race: null, error: writeError.message, code: writeError.code ?? undefined };
  }

  const { data, error: fetchError } = await client
    .from("hyrox_race_results")
    .select(HYROX_RACE_SELECT)
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Hyrox race result reload failed", fetchError);
    return { race: null, error: fetchError.message, code: fetchError.code ?? undefined };
  }

  return { race: (data as HyroxRaceResultRow | null) ?? null, error: null };
}
