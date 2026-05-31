import { NextResponse } from "next/server";
import {
  fetchLogsForPlan,
  isChallengeLoggingConfigured,
  upsertChallengeLog,
} from "@/app/lib/hybrid75ChallengeLogServer";
import {
  buildLogUpsertRow,
  type Hybrid75LogSessionType,
  type Hybrid75ProofType,
} from "@/app/lib/hybrid75ChallengeLogging";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

const SESSION_TYPES: Hybrid75LogSessionType[] = ["run", "lift", "mobility", "challenge"];
const PROOF_TYPES: Hybrid75ProofType[] = ["telegram", "instagram", "both", "not_yet"];

export async function GET(request: Request) {
  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ logs: [], configured: false });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan_id")?.trim();
  if (!planId) return badRequest("plan_id is required");

  try {
    const logs = await fetchLogsForPlan(planId);
    return NextResponse.json({ logs, configured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json(
      { error: "Challenge logging is not configured on this environment" },
      { status: 503 }
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
  const sessionId = typeof body.session_id === "string" ? body.session_id.trim() : "";
  const sessionTitle = typeof body.session_title === "string" ? body.session_title.trim() : "";
  const sessionType = body.session_type as Hybrid75LogSessionType;
  const proofType = body.proof_type as Hybrid75ProofType;
  const completed = body.completed === true;

  if (!planId) return badRequest("plan_id is required");
  if (!sessionId) return badRequest("session_id is required");
  if (!sessionTitle) return badRequest("session_title is required");
  if (!SESSION_TYPES.includes(sessionType)) return badRequest("Invalid session_type");
  if (!PROOF_TYPES.includes(proofType)) return badRequest("Invalid proof_type");

  const rpe = typeof body.rpe === "number" ? body.rpe : null;
  if (rpe != null && (rpe < 1 || rpe > 10)) return badRequest("rpe must be 1-10");

  const payload = {
    plan_id: planId,
    email: typeof body.email === "string" ? body.email : undefined,
    name: typeof body.name === "string" ? body.name : undefined,
    session_id: sessionId,
    session_title: sessionTitle,
    session_type: sessionType,
    completed,
    rpe,
    proof_type: proofType,
    proof_note: typeof body.proof_note === "string" ? body.proof_note : null,
    notes: typeof body.notes === "string" ? body.notes : null,
  };

  try {
    const log = await upsertChallengeLog(payload);
    const preview = buildLogUpsertRow(payload);
    return NextResponse.json({
      log,
      points_claimed: preview.points_claimed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
