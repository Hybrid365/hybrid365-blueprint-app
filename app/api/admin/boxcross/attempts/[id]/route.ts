import { NextResponse } from "next/server";
import { validateBoxCrossAdminRequest } from "@/app/lib/boxcross/adminAuth";
import {
  deleteAttempt,
  fetchChallengeBySlug,
  isBoxCrossDbConfigured,
  updateAttempt,
} from "@/app/lib/boxcross/server";
import {
  BOXCROSS_CHALLENGE_SLUG,
  type BoxCrossCreateAttemptInput,
} from "@/app/lib/boxcross/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const authError = validateBoxCrossAdminRequest(request);
  if (authError) return authError;

  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as Partial<BoxCrossCreateAttemptInput> & {
      verified?: boolean;
      verified_by?: string | null;
    };
    const challenge = await fetchChallengeBySlug(BOXCROSS_CHALLENGE_SLUG);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    const attempt = await updateAttempt(id, challenge, body);
    return NextResponse.json({ attempt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update attempt";
    const status = /not found/i.test(message)
      ? 404
      : /required|invalid|outside|greater|Category|Verification|final/i.test(message)
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const authError = validateBoxCrossAdminRequest(request);
  if (authError) return authError;

  if (!isBoxCrossDbConfigured()) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }

  try {
    const { id } = await ctx.params;
    const challenge = await fetchChallengeBySlug(BOXCROSS_CHALLENGE_SLUG);
    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }
    await deleteAttempt(id, challenge.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete attempt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
