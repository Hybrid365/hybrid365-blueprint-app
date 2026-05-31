import { NextResponse } from "next/server";
import { validateHybrid75AdminRequest } from "@/app/lib/hybrid75AdminAuth";
import {
  buildPublicLeaderboard,
  fetchAllPointAdjustments,
  isChallengeLoggingConfigured,
} from "@/app/lib/hybrid75ChallengeLogServer";

export async function GET(request: Request) {
  const authError = validateHybrid75AdminRequest(request);
  if (authError) return authError;

  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ error: "Challenge logging is not configured" }, { status: 503 });
  }

  try {
    const [rows, adjustments] = await Promise.all([
      buildPublicLeaderboard(),
      fetchAllPointAdjustments(),
    ]);

    return NextResponse.json({ rows, adjustments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
