import { NextResponse, type NextRequest } from "next/server";
import { isHyroxAthleteMockPreviewAllowed, readHyroxMockPreviewEnabled } from "@/app/lib/hyroxAthletePortalMock";
import { buildAthletePortalDebugSnapshot } from "@/app/lib/hyroxAthletePortalResolve";
import {
  createApiRouteSupabase,
  hyroxAthleteApiJson,
} from "@/app/lib/supabase/apiRoute";

/** Development-only portal resolution diagnostics. */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { supabase, withAuthCookies, authDebug } =
    await createApiRouteSupabase(request);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  authDebug.getUserSucceeded = Boolean(user);
  authDebug.userError = userError?.message ?? null;

  if (!user) {
    return hyroxAthleteApiJson(withAuthCookies, {
      error: "Not signed in",
      reason: "NO_AUTH_SESSION",
      authEmail: null,
      apiAuthEmail: null,
      authDebug,
    }, 401);
  }

  const mockPreviewEnabled =
    isHyroxAthleteMockPreviewAllowed() && readHyroxMockPreviewEnabled();

  const snapshot = await buildAthletePortalDebugSnapshot({
    user,
    mockPreviewEnabled,
  });

  return hyroxAthleteApiJson(withAuthCookies, {
    success: true,
    ...snapshot,
    apiAuthEmail: user.email?.trim().toLowerCase() ?? "",
    authDebug,
  });
}
