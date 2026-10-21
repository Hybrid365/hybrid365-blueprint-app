import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import {
  getHyroxAthletePerformanceProfile,
  insertAthleteBenchmark,
} from "@/app/lib/hyroxAthleteBenchmarkServer";
import { BenchmarkMathError } from "@/app/lib/hyroxBenchmarkMath";
import {
  ATHLETE_SUBMIT_TYPES,
  isBenchmarkType,
  normalizeBenchmarkInput,
  type BenchmarkDraftInput,
  type BenchmarkType,
} from "@/app/lib/hyroxBenchmarkTypes";
import { isHyroxPerformanceProfileEnabled } from "@/app/lib/hyrox-team/modules/performanceProfile/featureFlag";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

function disabled() {
  return NextResponse.json({ success: false, error: "Performance profile is not enabled." }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;
  if (!isHyroxPerformanceProfileEnabled({ id: auth.athlete.id, email: auth.athlete.email })) {
    return auth.withAuthCookies(disabled());
  }

  const { client } = await createCoachServerClient();
  const result = await getHyroxAthletePerformanceProfile(client, auth.athlete.id);
  if (result.error) {
    return auth.withAuthCookies(NextResponse.json({ success: false, error: result.error }, { status: 500 }));
  }

  return auth.withAuthCookies(
    NextResponse.json({
      success: true,
      unavailable: result.unavailable,
      profile: result.profile,
      results: result.rows.filter((row) => row.status !== "rejected"),
    })
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;
  if (!isHyroxPerformanceProfileEnabled({ id: auth.athlete.id, email: auth.athlete.email })) {
    return auth.withAuthCookies(disabled());
  }

  const body = (await request.json().catch(() => null)) as BenchmarkDraftInput | null;
  const type = body?.benchmarkType;
  if (!body || !type || !isBenchmarkType(type) || !ATHLETE_SUBMIT_TYPES.includes(type as BenchmarkType)) {
    return auth.withAuthCookies(
      NextResponse.json({ success: false, error: "Choose a supported benchmark." }, { status: 400 })
    );
  }

  try {
    const normalized = normalizeBenchmarkInput({ ...body, benchmarkType: type });
    const { client } = await createCoachServerClient();
    const row = await insertAthleteBenchmark(client, auth.athlete.id, normalized, {
      source: "athlete_submitted",
      status: "pending",
      makeActive: false,
      submittedByUserId: auth.athlete.user_id,
    });
    return auth.withAuthCookies(NextResponse.json({ success: true, result: row }));
  } catch (error) {
    const message = error instanceof BenchmarkMathError || error instanceof Error ? error.message : "Could not submit result.";
    const status = error instanceof BenchmarkMathError ? 400 : 500;
    return auth.withAuthCookies(NextResponse.json({ success: false, error: message }, { status }));
  }
}
