import { NextResponse } from "next/server";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";

export async function requireHyroxCoachApi() {
  const ctx = await getHyroxAccessContext();
  if (!ctx) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!ctx.isCoach) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ctx };
}
