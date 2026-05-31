import { NextResponse } from "next/server";
import { validateHybrid75AdminRequest } from "@/app/lib/hybrid75AdminAuth";
import {
  approveChallengeLog,
  isChallengeLoggingConfigured,
} from "@/app/lib/hybrid75ChallengeLogServer";

export async function POST(request: Request) {
  const authError = validateHybrid75AdminRequest(request);
  if (authError) return authError;

  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ error: "Challenge logging is not configured" }, { status: 503 });
  }

  const body = (await request.json()) as { log_id?: string; status?: "approved" | "rejected" };
  const logId = body.log_id?.trim();
  const status = body.status;

  if (!logId) {
    return NextResponse.json({ error: "log_id is required" }, { status: 400 });
  }
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  try {
    const log = await approveChallengeLog(logId, status);
    return NextResponse.json({ log });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update log";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
