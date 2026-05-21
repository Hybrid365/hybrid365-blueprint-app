import { NextResponse, type NextRequest } from "next/server";
import {
  attachDevDebug,
  autoLinkHyroxAthleteByEmail,
  autoLinkUserMessage,
} from "@/app/lib/hyroxAthleteAutoLink";
import { createApiRouteSupabase } from "@/app/lib/supabase/apiRoute";

export async function POST(request: NextRequest) {
  const { supabase, withAuthCookies } = createApiRouteSupabase(request);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return withAuthCookies(
      NextResponse.json(
        { success: false, linked: false, error: "Not signed in" },
        { status: 401 }
      )
    );
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return withAuthCookies(
      NextResponse.json({
        success: true,
        linked: false,
        reason: "NO_PAID_ATHLETE_FOUND",
        message: autoLinkUserMessage({
          linked: false,
          reason: "NO_PAID_ATHLETE_FOUND",
        }),
      })
    );
  }

  const raw = await autoLinkHyroxAthleteByEmail(user.id, email);
  const result = attachDevDebug(raw, raw.debug);
  const message = autoLinkUserMessage(result);

  if (process.env.NODE_ENV === "development") {
    console.log("[hyrox/auto-link]", {
      authUserId: user.id,
      authEmail: email,
      ...result,
    });
  }

  return withAuthCookies(
    NextResponse.json({
      success: true,
      ...result,
      ...(message ? { message } : {}),
    })
  );
}
