import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import {
  getHyroxAthletePerformanceProfile,
  insertAthleteBenchmark,
} from "@/app/lib/hyroxAthleteBenchmarkServer";
import { BenchmarkMathError } from "@/app/lib/hyroxBenchmarkMath";
import {
  COACH_ENTRY_TYPES,
  isBenchmarkType,
  normalizeBenchmarkInput,
  type BenchmarkDraftInput,
  type BenchmarkSource,
} from "@/app/lib/hyroxBenchmarkTypes";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

const COACH_SOURCES: BenchmarkSource[] = ["coach_entered", "lab_test", "imported"];

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const { client } = await createCoachServerClient();
  const result = await getHyroxAthletePerformanceProfile(client, id);
  if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  return NextResponse.json({
    success: true,
    unavailable: result.unavailable,
    profile: result.profile,
    results: result.rows,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | (BenchmarkDraftInput & { source?: BenchmarkSource; makeActive?: boolean })
    | null;
  const type = body?.benchmarkType;
  if (!body || !type || !isBenchmarkType(type) || !COACH_ENTRY_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: "Choose a supported benchmark." }, { status: 400 });
  }
  const source = COACH_SOURCES.includes(body.source as BenchmarkSource) ? (body.source as BenchmarkSource) : "coach_entered";

  try {
    const normalized = normalizeBenchmarkInput({ ...body, benchmarkType: type });
    const { client } = await createCoachServerClient();
    const row = await insertAthleteBenchmark(client, id, normalized, {
      source,
      status: "approved",
      makeActive: Boolean(body.makeActive),
      approvedByUserId: auth.ctx.userId,
      submittedByUserId: auth.ctx.userId,
    });
    return NextResponse.json({ success: true, result: row });
  } catch (error) {
    const message = error instanceof BenchmarkMathError || error instanceof Error ? error.message : "Could not save benchmark.";
    const status = error instanceof BenchmarkMathError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
