import { NextResponse } from "next/server";

/** Prefer dedicated BoxCross secret; fall back to shared challenge admin secret. */
export function getBoxCrossAdminSecret(): string | null {
  return (
    process.env.BOXCROSS_ADMIN_SECRET?.trim() ||
    process.env.CHALLENGE_LOG_ADMIN_SECRET?.trim() ||
    null
  );
}

/** Returns a 401/503 response if invalid, or null if authorized. */
export function validateBoxCrossAdminRequest(request: Request): NextResponse | null {
  const secret = getBoxCrossAdminSecret();
  if (!secret) {
    return NextResponse.json({ error: "BoxCross admin access is not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
