import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import {
  applyStoredBenchmarkAction,
  correctBenchmarkResult,
  updateBenchmarkNotes,
} from "@/app/lib/hyroxAthleteBenchmarkServer";
import { BenchmarkMathError } from "@/app/lib/hyroxBenchmarkMath";
import { isBenchmarkType, normalizeBenchmarkInput, type BenchmarkDraftInput } from "@/app/lib/hyroxBenchmarkTypes";
import { BenchmarkWorkflowError, type BenchmarkCoachAction } from "@/app/lib/hyroxBenchmarkWorkflow";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string; benchmarkId: string }> };

const ACTIONS: BenchmarkCoachAction[] = [
  "approve",
  "approve_and_activate",
  "reject",
  "make_active",
  "remove_active",
  "mark_historical",
];

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id, benchmarkId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    notes?: string;
    correction?: BenchmarkDraftInput;
  } | null;
  const { client } = await createCoachServerClient();

  try {
    if (body?.correction) {
      if (!isBenchmarkType(body.correction.benchmarkType)) {
        return NextResponse.json({ success: false, error: "Choose a supported benchmark." }, { status: 400 });
      }
      const normalized = normalizeBenchmarkInput(body.correction);
      const row = await correctBenchmarkResult(client, id, benchmarkId, normalized);
      return NextResponse.json({ success: true, result: row });
    }
    if (typeof body?.notes === "string" && !body.action) {
      const row = await updateBenchmarkNotes(client, id, benchmarkId, body.notes);
      return NextResponse.json({ success: true, result: row });
    }
    if (!body?.action || !ACTIONS.includes(body.action as BenchmarkCoachAction)) {
      return NextResponse.json({ success: false, error: "Choose a review action." }, { status: 400 });
    }
    const row = await applyStoredBenchmarkAction(
      client,
      id,
      benchmarkId,
      body.action as BenchmarkCoachAction,
      auth.ctx.userId
    );
    return NextResponse.json({ success: true, result: row });
  } catch (error) {
    const message =
      error instanceof BenchmarkWorkflowError || error instanceof BenchmarkMathError || error instanceof Error
        ? error.message
        : "Could not update benchmark.";
    const status = error instanceof BenchmarkWorkflowError || error instanceof BenchmarkMathError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
