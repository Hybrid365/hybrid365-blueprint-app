import { type NextRequest } from "next/server";
import { updateHyroxProtectedSession, updateSession } from "@/app/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") || path.startsWith("/athlete")) {
    return updateHyroxProtectedSession(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/admin/:path*", "/athlete/:path*"],
};
