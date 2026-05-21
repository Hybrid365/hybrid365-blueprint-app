import { NextResponse, type NextRequest } from "next/server";
import { isHyroxAthleteMockPreviewAllowed, readHyroxMockPreviewEnabled } from "@/app/lib/hyroxAthletePortalMock";
import { buildAthletePortalDebugSnapshot } from "@/app/lib/hyroxAthletePortalResolve";
import { createApiRouteSupabase, hasSupabaseAuthCookieNames } from "@/app/lib/supabase/apiRoute";

/** Development-only portal resolution diagnostics. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const requestCookies = request.cookies.getAll();
  const hasAuthCookie = hasSupabaseAuthCookieNames(requestCookies);
  const { supabase, withAuthCookies } = createApiRouteSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return withAuthCookies(
      NextResponse.json(
        {
          error: "Not signed in",
          reason: "NO_AUTH_SESSION",
          authEmail: null,
          hasAuthCookie,
          layoutAuthEmail: null,
          apiAuthEmail: null,
        },
        { status: 401 }
      )
    );
  }

  const mockPreviewEnabled =
    isHyroxAthleteMockPreviewAllowed() && readHyroxMockPreviewEnabled();

  const snapshot = await buildAthletePortalDebugSnapshot({
    user,
    mockPreviewEnabled,
  });

  return withAuthCookies(
    NextResponse.json({
      success: true,
      ...snapshot,
      hasAuthCookie,
      apiAuthEmail: user.email?.trim().toLowerCase() ?? "",
    })
  );
}
