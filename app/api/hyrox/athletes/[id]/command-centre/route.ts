import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { isHyroxCoachCommandCentreEnabled } from "@/app/lib/hyroxCoachCommandCentreFlag";
import { loadHyroxCommandCentre } from "@/app/lib/hyroxCommandCentreServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError) {
    return NextResponse.json({ success: false, error: fetchError }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }
  if (!isHyroxCoachCommandCentreEnabled({ id: athlete.id })) {
    return NextResponse.json({ success: false, error: "Command Centre is not enabled." }, { status: 404 });
  }

  try {
    const commandCentre = await loadHyroxCommandCentre(supabase, athlete as HyroxAthleteRow);
    return NextResponse.json({ success: true, commandCentre });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load command centre.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
