import { NextResponse } from "next/server";
import { buildLeaderboardPayload } from "@/app/lib/boxcross/leaderboard";
import {
  fetchAttemptsForChallenge,
  fetchChallengeBySlug,
  isBoxCrossDbConfigured,
} from "@/app/lib/boxcross/server";
import { BOXCROSS_CHALLENGE_SLUG, type BoxCrossLeaderboardTab } from "@/app/lib/boxcross/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseTab(value: string | null): BoxCrossLeaderboardTab {
  if (value === "male" || value === "female" || value === "overall") return value;
  return "overall";
}

export async function GET(request: Request) {
  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json(
      {
        error: "Leaderboard is not configured",
        rows: [],
        stats: null,
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tab = parseTab(searchParams.get("tab"));
  const slug = searchParams.get("slug")?.trim() || BOXCROSS_CHALLENGE_SLUG;

  try {
    const challenge = await fetchChallengeBySlug(slug);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Public API: verified attempts only — never expose internal notes / unverified rows
    const attempts = await fetchAttemptsForChallenge(challenge.id, { verifiedOnly: true });
    const payload = buildLeaderboardPayload(challenge, attempts, tab);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
