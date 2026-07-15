import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import {
  buildAthletePerformanceTestingPayload,
  upsertPerformanceTestResult,
  upsertRecoveryBaseline,
  type UpsertPerformanceTestInput,
  type UpsertRecoveryBaselineInput,
} from "@/app/lib/hyroxPerformanceTestingServer";
import {
  PERFORMANCE_TEST_WEEK_ID,
  type PerformanceTestType,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { hyroxAthleteApiJson } from "@/app/lib/supabase/apiRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const { athlete, withAuthCookies } = auth;
  const { client: supabase } = await createCoachServerClient();

  try {
    const testWeekId =
      request.nextUrl.searchParams.get("testWeekId") ?? PERFORMANCE_TEST_WEEK_ID;
    const payload = await buildAthletePerformanceTestingPayload(supabase, athlete, testWeekId);

    return hyroxAthleteApiJson(withAuthCookies, {
      success: true,
      ...payload,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load performance testing.";
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return hyroxAthleteApiJson(
      auth.withAuthCookies,
      { success: false, error: "Invalid JSON body." },
      400
    );
  }

  const { athlete, withAuthCookies } = auth;
  const { client: supabase } = await createCoachServerClient();
  const action = String(body.action ?? "upsert_result");

  try {
    if (action === "upsert_baseline") {
      const input: UpsertRecoveryBaselineInput = {
        testWeekId: String(body.testWeekId ?? PERFORMANCE_TEST_WEEK_ID),
        restingHrBaseline: Number(body.restingHrBaseline),
        baselineDays: Number(body.baselineDays),
        averageHrv: body.averageHrv != null ? Number(body.averageHrv) : null,
        averageSleepMinutes:
          body.averageSleepMinutes != null ? Number(body.averageSleepMinutes) : null,
        averageDailySteps:
          body.averageDailySteps != null ? Number(body.averageDailySteps) : null,
        averageTrainingHours:
          body.averageTrainingHours != null ? Number(body.averageTrainingHours) : null,
        deviceSource: body.deviceSource != null ? String(body.deviceSource) : null,
        notes: body.notes != null ? String(body.notes) : null,
      };

      const baseline = await upsertRecoveryBaseline(supabase, athlete.id, input);
      const payload = await buildAthletePerformanceTestingPayload(
        supabase,
        athlete,
        input.testWeekId
      );

      return hyroxAthleteApiJson(withAuthCookies, {
        success: true,
        ...payload,
      });
    }

    const input: UpsertPerformanceTestInput = {
      testWeekId: String(body.testWeekId ?? PERFORMANCE_TEST_WEEK_ID),
      programmeWeekId: body.programmeWeekId != null ? String(body.programmeWeekId) : null,
      testType: String(body.testType) as PerformanceTestType,
      status: String(body.status ?? "draft") as UpsertPerformanceTestInput["status"],
      resultJson: (body.resultJson as Record<string, unknown>) ?? {},
      notes: body.notes != null ? String(body.notes) : null,
      videoUrl: body.videoUrl != null ? String(body.videoUrl) : null,
      proofUrl: body.proofUrl != null ? String(body.proofUrl) : null,
      testDate: body.testDate != null ? String(body.testDate) : null,
    };

    const result = await upsertPerformanceTestResult(supabase, athlete.id, input);
    const payload = await buildAthletePerformanceTestingPayload(
      supabase,
      athlete,
      input.testWeekId
    );

    return hyroxAthleteApiJson(withAuthCookies, {
      success: true,
      result,
      ...payload,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save performance test.";
    const status = message.includes("coach-reviewed") ? 403 : 400;
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, status);
  }
}
