import { NextResponse } from "next/server";
import { validateBoxCrossAdminRequest } from "@/app/lib/boxcross/adminAuth";
import { buildLeaderboardPayload } from "@/app/lib/boxcross/leaderboard";
import {
  fetchAttemptsForChallenge,
  fetchChallengeBySlug,
  isBoxCrossDbConfigured,
  markChallengeFinal,
} from "@/app/lib/boxcross/server";
import { BOXCROSS_CHALLENGE_SLUG } from "@/app/lib/boxcross/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = validateBoxCrossAdminRequest(request);
  if (authError) return authError;

  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const challenge = await fetchChallengeBySlug(BOXCROSS_CHALLENGE_SLUG);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    const attempts = await fetchAttemptsForChallenge(challenge.id);
    const board = buildLeaderboardPayload(challenge, attempts, "overall");
    return NextResponse.json({ challenge, attempts, board });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = validateBoxCrossAdminRequest(request);
  if (authError) return authError;

  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "mark_final") {
      const challenge = await fetchChallengeBySlug(BOXCROSS_CHALLENGE_SLUG);
      if (!challenge) {
        return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
      }
      const updated = await markChallengeFinal(challenge.id);
      return NextResponse.json({ challenge: updated });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update challenge";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
