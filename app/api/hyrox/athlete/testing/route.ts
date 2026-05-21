import { NextResponse } from "next/server";
import {
  benchmarkKindForTestId,
  type BenchmarkSubmission,
  type BenchmarkTestId,
  type HyroxRaceSplitSubmission,
} from "@/app/athlete/testing/hyroxTestingTypes";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { syncHyroxAthleteStatus } from "@/app/lib/hyroxAthleteProgress";
import { buildAthleteBenchmarkSnapshot } from "@/app/lib/hyroxAthleteBenchmarkSnapshot";
import {
  fetchHyroxAthleteTestingRows,
  upsertHyroxRaceResult,
  upsertHyroxTestingResult,
} from "@/app/lib/hyroxAthleteTestingDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxTestingResultRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  CORE_TEST_IDS,
  dbTestTypeForBenchmark,
  dbTestTypeForTestId,
} from "@/app/lib/hyroxTestingPayload";

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

function testingSaveErrorResponse(message: string, code?: string) {
  const body: Record<string, unknown> = {
    success: false,
    error: "TESTING_SAVE_FAILED",
    detail: message,
  };
  if (process.env.NODE_ENV === "development" && code) {
    body.code = code;
  }
  return NextResponse.json(body, { status: 500 });
}

function normalizeRoxfitScreenshot(value: string | null | undefined): "" | "yes" | "no" {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "yes" || v === "no") return v;
  return "";
}

function mapRaceRowToSubmission(
  raceRow: NonNullable<Awaited<ReturnType<typeof fetchHyroxAthleteTestingRows>>["race"]>
): HyroxRaceSplitSubmission {
  return {
    id: raceRow.id,
    submittedAt: raceRow.created_at,
    raceLocation: raceRow.race_event ?? "",
    raceDate: raceRow.race_date ?? "",
    category: raceRow.category ?? "",
    totalFinishTime: raceRow.total_time ?? "",
    bodyweightKg: raceRow.bodyweight != null ? String(raceRow.bodyweight) : "",
    runSplits: (raceRow.run_splits as HyroxRaceSplitSubmission["runSplits"]) ?? {},
    stationSplits: (raceRow.station_splits as HyroxRaceSplitSubmission["stationSplits"]) ?? {},
    worstStation: raceRow.weakest_station ?? "",
    worstRun: raceRow.weakest_run ?? "",
    biggestLimiter: raceRow.biggest_limiter ?? "",
    raceNotes: raceRow.notes ?? "",
    roxfitScreenshot: normalizeRoxfitScreenshot(raceRow.roxfit_screenshot_url),
    unusual: "",
  };
}

export async function GET() {
  const auth = await requireCurrentHyroxAthleteForApi();
  if (auth.error) return auth.error;

  const { athlete } = auth;
  const { tests, race: raceRow, error } = await fetchHyroxAthleteTestingRows(athlete.id);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const benchmarks: Record<
    string,
    { id: string; submission: BenchmarkSubmission; submittedAt: string; testType: string }
  > = {};

  for (const row of tests) {
    const testId = TEST_ID_BY_DB_TYPE[row.test_type];
    if (!testId || benchmarks[testId]) continue;
    const result = row.result as BenchmarkSubmission;
    if (!result?.kind) {
      const kind = benchmarkKindForTestId(testId);
      benchmarks[testId] = {
        id: row.id,
        testType: row.test_type,
        submission: { ...row.result, kind } as BenchmarkSubmission,
        submittedAt: row.created_at,
      };
    } else {
      benchmarks[testId] = {
        id: row.id,
        testType: row.test_type,
        submission: result,
        submittedAt: row.created_at,
      };
    }
  }

  const race = raceRow ? mapRaceRowToSubmission(raceRow) : null;
  const coreSubmitted = CORE_TEST_IDS.filter((id) => benchmarks[id]).length;

  const snapshot = buildAthleteBenchmarkSnapshot(tests);

  return NextResponse.json({
    benchmarks,
    snapshot,
    race,
    coreSubmittedCount: coreSubmitted,
    coreRequiredCount: CORE_TEST_IDS.length,
    athleteStatus: athlete.status,
  });
}

export async function POST(request: Request) {
  const auth = await requireCurrentHyroxAthleteForApi();
  if (auth.error) return auth.error;

  const body = (await request.json()) as {
    type?: "benchmark" | "race";
    testId?: BenchmarkTestId;
    submission?: BenchmarkSubmission;
    testDate?: string;
    race?: Omit<HyroxRaceSplitSubmission, "id" | "submittedAt">;
  };

  const { athlete, user } = auth;

  if (athlete.user_id && athlete.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: "Athlete profile is not linked to this sign-in." },
      { status: 403 }
    );
  }

  if (body.type === "race" && body.race) {
    const raceInput: HyroxRaceSplitSubmission = {
      ...body.race,
      id: "pending",
      submittedAt: new Date().toISOString(),
    };

    const { race: saved, error, code } = await upsertHyroxRaceResult(athlete.id, raceInput);

    if (error || !saved) {
      return testingSaveErrorResponse(error ?? "Race save returned no row.", code);
    }

    let nextStatus = athlete.status;
    try {
      const { client } = await createCoachServerClient();
      nextStatus = await syncHyroxAthleteStatus(client, athlete, {
        changedBy: user.id,
        reason: "race_result_submitted",
      });
    } catch (syncErr) {
      const message = syncErr instanceof Error ? syncErr.message : String(syncErr);
      console.error("Hyrox testing status sync failed", message);
    }

    const { tests: allTests } = await fetchHyroxAthleteTestingRows(athlete.id);
    const snapshot = buildAthleteBenchmarkSnapshot(allTests);

    return NextResponse.json({
      success: true,
      snapshot,
      race: mapRaceRowToSubmission(saved),
      nextStatus,
    });
  }

  if (body.type === "benchmark" && body.testId && body.submission) {
    const testType = body.submission.kind
      ? dbTestTypeForBenchmark(body.submission)
      : dbTestTypeForTestId(body.testId);

    const { result: saved, error, code } = await upsertHyroxTestingResult(
      athlete.id,
      testType,
      body.submission,
      body.testDate
    );

    if (error || !saved) {
      return testingSaveErrorResponse(error ?? "Benchmark save returned no row.", code);
    }

    let nextStatus = athlete.status;
    try {
      const { client } = await createCoachServerClient();
      nextStatus = await syncHyroxAthleteStatus(client, athlete, {
        changedBy: user.id,
        reason: "testing_submitted",
      });
    } catch (syncErr) {
      const message = syncErr instanceof Error ? syncErr.message : String(syncErr);
      console.error("Hyrox testing status sync failed", message);
    }

    const { tests: allTests } = await fetchHyroxAthleteTestingRows(athlete.id);
    const snapshot = buildAthleteBenchmarkSnapshot(allTests);

    return NextResponse.json({
      success: true,
      result: saved as HyroxTestingResultRow,
      testId: body.testId,
      snapshot,
      nextStatus,
    });
  }

  return NextResponse.json({ error: "Invalid testing payload." }, { status: 400 });
}
