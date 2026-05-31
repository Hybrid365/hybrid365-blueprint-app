import { NextResponse } from "next/server";

export function getHybrid75AdminSecret(): string | null {
  return process.env.CHALLENGE_LOG_ADMIN_SECRET?.trim() || null;
}

/** Returns a 401/503 response if invalid, or null if authorized. */
export function validateHybrid75AdminRequest(request: Request): NextResponse | null {
  const secret = getHybrid75AdminSecret();
  if (!secret) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function isHybrid75AdminAuthorized(request: Request): boolean {
  const secret = getHybrid75AdminSecret();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
