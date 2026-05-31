import { NextResponse } from "next/server";
import { validateHybrid75AdminRequest } from "@/app/lib/hybrid75AdminAuth";

export async function POST(request: Request) {
  const authError = validateHybrid75AdminRequest(request);
  if (authError) return authError;
  return NextResponse.json({ ok: true });
}
