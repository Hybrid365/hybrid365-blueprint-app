import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchCoachCheckInHistory } from "@/app/lib/hyroxAthleteCheckInServer";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError || !athlete) {
    return NextResponse.json(
      { success: false, error: fetchError ?? "Athlete not found." },
      { status: 404 }
    );
  }

  try {
    const checkIns = await fetchCoachCheckInHistory(supabase, athlete.id);
    return NextResponse.json({ success: true, checkIns });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load check-ins.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
