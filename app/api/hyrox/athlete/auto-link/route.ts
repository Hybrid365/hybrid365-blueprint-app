import { NextResponse } from "next/server";
import {
  attachDevDebug,
  autoLinkHyroxAthleteByEmail,
  autoLinkUserMessage,
} from "@/app/lib/hyroxAthleteAutoLink";
import { createClient } from "@/app/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, linked: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const email = user.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({
      success: true,
      linked: false,
      reason: "NO_PAID_ATHLETE_FOUND",
      message: autoLinkUserMessage({
        linked: false,
        reason: "NO_PAID_ATHLETE_FOUND",
      }),
    });
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

  return NextResponse.json({
    success: true,
    ...result,
    ...(message ? { message } : {}),
  });
}
