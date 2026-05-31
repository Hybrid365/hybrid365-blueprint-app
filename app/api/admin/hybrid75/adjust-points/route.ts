import { NextResponse } from "next/server";
import { validateHybrid75AdminRequest } from "@/app/lib/hybrid75AdminAuth";
import {
  createPointAdjustment,
  isChallengeLoggingConfigured,
} from "@/app/lib/hybrid75ChallengeLogServer";

export async function POST(request: Request) {
  const authError = validateHybrid75AdminRequest(request);
  if (authError) return authError;

  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ error: "Challenge logging is not configured" }, { status: 503 });
  }

  const body = (await request.json()) as {
    email?: string;
    name?: string;
    plan_id?: string;
    points?: number;
    reason?: string;
    created_by?: string;
  };

  const email = body.email?.trim();
  const reason = body.reason?.trim();
  const points = body.points;

  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });
  if (!reason) return NextResponse.json({ error: "reason is required" }, { status: 400 });
  if (typeof points !== "number" || !Number.isInteger(points)) {
    return NextResponse.json({ error: "points must be an integer" }, { status: 400 });
  }
  if (points === 0) return NextResponse.json({ error: "points cannot be 0" }, { status: 400 });
  if (points < -500 || points > 500) {
    return NextResponse.json({ error: "points must be between -500 and 500" }, { status: 400 });
  }

  try {
    const adjustment = await createPointAdjustment({
      email,
      name: body.name,
      plan_id: body.plan_id,
      points,
      reason,
      created_by: body.created_by,
    });
    return NextResponse.json({ adjustment });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to apply adjustment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
