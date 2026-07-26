import { NextResponse } from "next/server";
import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";
import {
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
  verifyHyroxAdminAthletePreviewToken,
} from "@/app/lib/hyroxAdminAthletePreview";
import { recordHyroxAdminPreviewAudit } from "@/app/lib/hyroxAdminPreviewAudit";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Clear preview cookie and return to the coach athlete workspace.
 */
export async function GET(request: Request, context: RouteContext) {
  const coach = await assertHyroxCoachAccess();
  const { id } = await context.params;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE}=`));
  const raw = match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
  const verified = verifyHyroxAdminAthletePreviewToken(raw);

  const { client: supabase } = await createCoachServerClient();
  if (verified.ok) {
    await recordHyroxAdminPreviewAudit(supabase, {
      coachUserId: coach.userId,
      athleteId: verified.payload.athleteId,
      event: "preview_ended",
      route: `/admin/hyrox-athletes/${id}/preview`,
    });
  }

  const dest = new URL(`/admin/hyrox-athletes/${id}`, request.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set(HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
