import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import {
  assessmentImportIdempotencyKey,
  buildAssessmentBenchmarkBridge,
  findAssessmentCandidate,
} from "@/app/lib/hyroxAssessmentBenchmarkBridge";
import { fetchLatestHyroxAssessment } from "@/app/lib/hyroxAthleteAssessmentDb";
import {
  getHyroxAthletePerformanceProfile,
  insertAthleteBenchmark,
  submissionIdempotencyKey,
} from "@/app/lib/hyroxAthleteBenchmarkServer";
import { BenchmarkMathError } from "@/app/lib/hyroxBenchmarkMath";
import {
  COACH_ENTRY_TYPES,
  isBenchmarkType,
  normalizeBenchmarkInput,
  type BenchmarkDraftInput,
  type BenchmarkSource,
} from "@/app/lib/hyroxBenchmarkTypes";
import { BenchmarkWorkflowError } from "@/app/lib/hyroxBenchmarkWorkflow";
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

  const assessmentLoad = await fetchLatestHyroxAssessment(id);
  const assessmentBridge =
    !result.unavailable && assessmentLoad.assessment
      ? buildAssessmentBenchmarkBridge(assessmentLoad.assessment, result.rows)
      : null;

  return NextResponse.json({
    success: true,
    unavailable: result.unavailable,
    profile: result.profile,
    results: result.rows,
    assessmentBridge,
    assessmentError: assessmentLoad.error,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | (BenchmarkDraftInput & {
        source?: BenchmarkSource;
        makeActive?: boolean;
        submissionKey?: string;
        action?: string;
        assessmentFieldKey?: string;
        forceDuplicate?: boolean;
      })
    | null;

  // Import a completed assessment field into Performance Profile (pending unless makeActive).
  if (body?.action === "import_assessment") {
    const fieldKey = body.assessmentFieldKey?.trim();
    if (!fieldKey) {
      return NextResponse.json(
        { success: false, error: "Choose an assessment field to import." },
        { status: 400 }
      );
    }
    try {
      const { client } = await createCoachServerClient();
      const profileResult = await getHyroxAthletePerformanceProfile(client, id);
      if (profileResult.error) {
        return NextResponse.json({ success: false, error: profileResult.error }, { status: 500 });
      }
      if (profileResult.unavailable) {
        return NextResponse.json(
          { success: false, error: "Performance Profile table is unavailable." },
          { status: 503 }
        );
      }
      const assessmentLoad = await fetchLatestHyroxAssessment(id);
      if (assessmentLoad.error || !assessmentLoad.assessment) {
        return NextResponse.json(
          { success: false, error: assessmentLoad.error ?? "No completed assessment found." },
          { status: 404 }
        );
      }
      const bridge = buildAssessmentBenchmarkBridge(
        assessmentLoad.assessment,
        profileResult.rows
      );
      if (!bridge) {
        return NextResponse.json(
          { success: false, error: "No importable assessment results." },
          { status: 400 }
        );
      }
      const candidate = findAssessmentCandidate(bridge, fieldKey);
      if (!candidate || candidate.contextOnly) {
        return NextResponse.json(
          { success: false, error: "That assessment field cannot be imported." },
          { status: 400 }
        );
      }
      if (
        (candidate.match === "active_same" || candidate.match === "pending_same") &&
        !body.forceDuplicate
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              candidate.match === "active_same"
                ? "This value is already active for programming."
                : "This value is already pending review.",
            duplicate: true,
            match: candidate.match,
          },
          { status: 409 }
        );
      }
      if (candidate.match === "active_different" && !body.forceDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error:
              candidate.matchDetail ??
              "An active value already exists for this type. Confirm to add as pending.",
            requiresConfirm: true,
            match: candidate.match,
          },
          { status: 409 }
        );
      }

      const makeActive = Boolean(body.makeActive);
      const normalized = normalizeBenchmarkInput(candidate.draft);
      const saved = await insertAthleteBenchmark(client, id, normalized, {
        source: "onboarding_test",
        status: makeActive ? "approved" : "pending",
        makeActive,
        approvedByUserId: makeActive ? auth.ctx.userId : null,
        submittedByUserId: auth.ctx.userId,
        sourceTable: "hyrox_assessments",
        sourceId: bridge.assessmentId,
        idempotencyKey: assessmentImportIdempotencyKey(
          bridge.assessmentId,
          candidate.key,
          candidate.draft
        ),
      });
      return NextResponse.json({
        success: true,
        result: saved.row,
        duplicate: saved.duplicate,
        makeActive,
      });
    } catch (error) {
      const message =
        error instanceof BenchmarkMathError || error instanceof Error
          ? error.message
          : "Could not import assessment result.";
      const status =
        error instanceof BenchmarkMathError || error instanceof BenchmarkWorkflowError ? 400 : 500;
      return NextResponse.json({ success: false, error: message }, { status });
    }
  }

  const type = body?.benchmarkType;
  if (!body || !type || !isBenchmarkType(type) || !COACH_ENTRY_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: "Choose a supported benchmark." }, { status: 400 });
  }
  const source = COACH_SOURCES.includes(body.source as BenchmarkSource)
    ? (body.source as BenchmarkSource)
    : "coach_entered";

  try {
    const normalized = normalizeBenchmarkInput({ ...body, benchmarkType: type });
    const { client } = await createCoachServerClient();
    const saved = await insertAthleteBenchmark(client, id, normalized, {
      source,
      status: "approved",
      makeActive: Boolean(body.makeActive),
      approvedByUserId: auth.ctx.userId,
      submittedByUserId: auth.ctx.userId,
      idempotencyKey: submissionIdempotencyKey("coach", body.submissionKey),
    });
    return NextResponse.json({ success: true, result: saved.row, duplicate: saved.duplicate });
  } catch (error) {
    const message =
      error instanceof BenchmarkMathError || error instanceof Error
        ? error.message
        : "Could not save benchmark.";
    const status =
      error instanceof BenchmarkMathError || error instanceof BenchmarkWorkflowError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
