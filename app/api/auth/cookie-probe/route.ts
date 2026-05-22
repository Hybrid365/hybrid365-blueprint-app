import { NextResponse } from "next/server";
import { attachH365CookieProbe, H365_COOKIE_PROBE_NAME } from "@/app/lib/supabase/cookieProbe";

export const dynamic = "force-dynamic";

/** Sets a small test cookie — visit /athlete/auth-debug next to see if the browser stored it. */
export async function GET() {
  const response = NextResponse.json({ ok: true, cookie: H365_COOKIE_PROBE_NAME });
  attachH365CookieProbe(response);
  return response;
}
