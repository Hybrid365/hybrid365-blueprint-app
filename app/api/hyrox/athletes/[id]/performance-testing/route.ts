import { NextResponse, type NextRequest } from "next/server";
import { buildHyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import {
  buildAthletePerformanceTestingPayload,
  coachReviewPerformanceTestResult,
  upsertPerformanceTestResult,
  upsertRecoveryBaseline,
  type UpsertPerformanceTestInput,
  type UpsertRecoveryBaselineInput,
} from "@/app/lib/hyroxPerformanceTestingServer";
import {
  PERFORMANCE_TEST_WEEK_ID,
  type PerformanceTestType,
} from "@/app/lib/hyroxPerformanceTestingTypes";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function loadCoachAthleteOr404(supabase: Awaited<ReturnType<typeof createCoachServerClient>>["client"], athleteId: string) {
  const { athlete, error } = await fetchHyroxAthleteById(supabase, athleteId);
  if (error) throw new Error(error);
  if (!athlete) return null;
  return athlete;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const testWeekId =
    request.nextUrl.searchParams.get("testWeekId") ?? PERFORMANCE_TEST_WEEK_ID;

  const { client: supabase } = await createCoachServerClient();

  try {
    const athlete = await loadCoachAthleteOr404(supabase, athleteId);
    if (!athlete) {
      return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
    }

    const payload = await buildAthletePerformanceTestingPayload(supabase, athlete, testWeekId);

    return NextResponse.json({
      success: true,
      athlete: {
        id: athlete.id,
        name: athlete.name,
        email: athlete.email,
        status: athlete.status,
      },
      ...payload,
      profile: buildHyroxPerformanceProfile(payload.results, payload.baseline),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load performance testing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { client: supabase } = await createCoachServerClient();

  try {
    const athlete = await loadCoachAthleteOr404(supabase, athleteId);
    if (!athlete) {
      return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
    }

    const action = String(body.action ?? "upsert_result");

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

      return NextResponse.json({
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

    return NextResponse.json({
      success: true,
      result,
      ...payload,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save performance test.";
    const status = message.includes("coach-reviewed") ? 403 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { client: supabase } = await createCoachServerClient();

  try {
    const result = await coachReviewPerformanceTestResult(supabase, athleteId, {
      resultId: String(body.resultId),
      coachReviewed: Boolean(body.coachReviewed),
      coachNotes: body.coachNotes != null ? String(body.coachNotes) : null,
      reopen: Boolean(body.reopen),
    });

    return NextResponse.json({ success: true, result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not update coach review.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
