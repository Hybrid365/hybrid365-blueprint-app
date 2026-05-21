import { NextResponse } from "next/server";
import { isHyroxAthleteMockPreviewAllowed, readHyroxMockPreviewEnabled } from "@/app/lib/hyroxAthletePortalMock";
import { buildAthletePortalDebugSnapshot } from "@/app/lib/hyroxAthletePortalResolve";
import { createClient } from "@/app/lib/supabase/server";

/** Development-only portal resolution diagnostics. */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Not signed in",
        reason: "NO_AUTH_SESSION",
        authEmail: null,
      },
      { status: 401 }
    );
  }

  const mockPreviewEnabled =
    isHyroxAthleteMockPreviewAllowed() && readHyroxMockPreviewEnabled();

  const snapshot = await buildAthletePortalDebugSnapshot({
    user,
    mockPreviewEnabled,
  });

  return NextResponse.json({ success: true, ...snapshot });
}
