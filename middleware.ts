import { type NextRequest, NextResponse } from "next/server";
import { updateHyroxProtectedSession, updateSession } from "@/app/lib/supabase/middleware";

/** Hybrid 75 admin uses CHALLENGE_LOG_ADMIN_SECRET — not member/Hyrox login. */
function isHybrid75LeaderboardAdminPath(path: string): boolean {
  return (
    path === "/admin/hybrid75-leaderboard" ||
    path.startsWith("/admin/hybrid75-leaderboard/")
  );
}

/** BoxCross Ski Challenge admin uses BOXCROSS_ADMIN_SECRET / CHALLENGE_LOG_ADMIN_SECRET. */
function isBoxCrossSkiAdminPath(path: string): boolean {
  return (
    path === "/admin/boxcross-ski-challenge" ||
    path.startsWith("/admin/boxcross-ski-challenge/")
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isHybrid75LeaderboardAdminPath(path) || isBoxCrossSkiAdminPath(path)) {
    return NextResponse.next();
  }

  if (
    path.startsWith("/admin") ||
    path.startsWith("/athlete") ||
    path.startsWith("/api/hyrox/athlete")
  ) {
    return updateHyroxProtectedSession(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/admin/:path*",
    "/athlete/:path*",
    "/api/hyrox/athlete/:path*",
  ],
};
