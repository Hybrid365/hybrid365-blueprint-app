import { NextResponse, type NextRequest } from "next/server";
import { buildHyroxPerformanceProfile } from "@/app/lib/hyroxPerformanceProfile";
import {
  buildAthletePerformanceTestingPayload,
  coachReviewPerformanceTestResult,
  fetchPerformanceTestResults,
  fetchRecoveryBaseline,
  findPublishedPerformanceTestingWeek,
} from "@/app/lib/hyroxPerformanceTestingServer";
import { PERFORMANCE_TEST_WEEK_ID } from "@/app/lib/hyroxPerformanceTestingTypes";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const testWeekId =
    request.nextUrl.searchParams.get("testWeekId") ?? PERFORMANCE_TEST_WEEK_ID;

  const { client: supabase } = await createCoachServerClient();

  try {
    const { data: athlete, error: athleteError } = await supabase
      .from("hyrox_athletes")
      .select("id, name, email, status")
      .eq("id", athleteId)
      .maybeSingle();

    if (athleteError) throw new Error(athleteError.message);
    if (!athlete) {
      return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
    }

    const [weekInfo, results, baseline] = await Promise.all([
      findPublishedPerformanceTestingWeek(supabase, athleteId, testWeekId),
      fetchPerformanceTestResults(supabase, athleteId, testWeekId),
      fetchRecoveryBaseline(supabase, athleteId, testWeekId),
    ]);

    const profile = buildHyroxPerformanceProfile(results, baseline);

    return NextResponse.json({
      success: true,
      athlete,
      testWeekId,
      programmeWeekId: weekInfo.programmeWeekId,
      sessions: weekInfo.sessions,
      results,
      baseline,
      profile,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load performance testing.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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
