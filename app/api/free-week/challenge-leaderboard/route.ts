import { NextResponse } from "next/server";
import {
  buildPublicLeaderboard,
  getUserLeaderboardSummary,
  isChallengeLoggingConfigured,
} from "@/app/lib/hybrid75ChallengeLogServer";

export async function GET(request: Request) {
  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ rows: [], configured: false, user: null });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan_id")?.trim();

  try {
    const rows = await buildPublicLeaderboard();
    const officialRows = rows.filter((row) => row.total_points > 0);

    let user = null;
    if (planId) {
      user = await getUserLeaderboardSummary(planId);
    }

    return NextResponse.json({
      rows: officialRows.length > 0 ? officialRows : rows.slice(0, 20),
      hasOfficialRows: officialRows.length > 0,
      configured: true,
      user,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
