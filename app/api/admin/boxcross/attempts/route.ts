import { NextResponse } from "next/server";
import { validateBoxCrossAdminRequest } from "@/app/lib/boxcross/adminAuth";
import {
  createAttempt,
  fetchChallengeBySlug,
  isBoxCrossDbConfigured,
} from "@/app/lib/boxcross/server";
import {
  BOXCROSS_CHALLENGE_SLUG,
  type BoxCrossCreateAttemptInput,
} from "@/app/lib/boxcross/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = validateBoxCrossAdminRequest(request);
  if (authError) return authError;

  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as BoxCrossCreateAttemptInput;
    const challenge = await fetchChallengeBySlug(BOXCROSS_CHALLENGE_SLUG);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Server decides verification — never trust client blindly for public surface;
    // admin may set verified explicitly (defaults true for staff entry workflow).
    const attempt = await createAttempt(challenge, {
      ...body,
      verified: body.verified ?? true,
    });

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create attempt";
    const status = /required|invalid|outside|greater|Category|Verification|final/i.test(message)
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
