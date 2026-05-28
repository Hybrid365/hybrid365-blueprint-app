import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { createHyroxOnboardingLinkToken } from "@/app/lib/hyroxOnboardingLinkToken";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id: athleteId } = await context.params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, athleteId);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  const token = createHyroxOnboardingLinkToken({
    athleteId: athlete.id,
    applicationId: athlete.application_id,
    email: athlete.email,
    athleteName: athlete.name,
  });

  const origin = new URL(request.url).origin;
  const url = `${origin}/hyrox-team/onboarding/${encodeURIComponent(token)}`;

  return NextResponse.json({
    success: true,
    url,
    token,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
