import { NextResponse } from "next/server";
import { getHyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const { client } = await createCoachServerClient();
  const analytics = await getHyroxAthleteAnalytics(client, id);
  return NextResponse.json({ success: true, analytics });
}
