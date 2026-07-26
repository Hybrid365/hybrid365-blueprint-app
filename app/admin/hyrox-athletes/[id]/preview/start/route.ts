import { NextResponse } from "next/server";
import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";
import {
  createHyroxAdminAthletePreviewToken,
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
  previewCookieOptions,
  previewPathForAthlete,
} from "@/app/lib/hyroxAdminAthletePreview";
import { recordHyroxAdminPreviewAudit } from "@/app/lib/hyroxAdminPreviewAudit";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Authorised entry: set httpOnly preview cookie, audit, redirect into preview shell.
 */
export async function GET(request: Request, context: RouteContext) {
  const coach = await assertHyroxCoachAccess();
  const { id } = await context.params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, id);

  if (error || !athlete) {
    return NextResponse.redirect(new URL("/admin/hyrox-athletes", request.url));
  }

  const token = createHyroxAdminAthletePreviewToken({
    coachUserId: coach.userId,
    athleteId: athlete.id,
  });

  await recordHyroxAdminPreviewAudit(supabase, {
    coachUserId: coach.userId,
    athleteId: athlete.id,
    event: "preview_started",
    route: previewPathForAthlete(athlete.id),
  });

  const url = new URL(request.url);
  const section = url.searchParams.get("section")?.trim() || "";
  const dest = new URL(previewPathForAthlete(athlete.id, section), request.url);
  const res = NextResponse.redirect(dest);
  res.cookies.set(HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE, token, previewCookieOptions());
  return res;
}
