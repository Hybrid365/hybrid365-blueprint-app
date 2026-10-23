import { NextResponse, type NextRequest } from "next/server";
import { getHyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { isHyroxAthleteAnalyticsEnabled } from "@/app/lib/hyroxAthleteAnalyticsFlag";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

function disabled() {
  return NextResponse.json({ success: false, error: "Athlete analytics is not enabled." }, { status: 404 });
}

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;
  if (!isHyroxAthleteAnalyticsEnabled({ id: auth.athlete.id, email: auth.athlete.email })) {
    return auth.withAuthCookies(disabled());
  }

  const { client } = await createCoachServerClient();
  const analytics = await getHyroxAthleteAnalytics(client, auth.athlete.id);
  return auth.withAuthCookies(NextResponse.json({ success: true, analytics }));
}
