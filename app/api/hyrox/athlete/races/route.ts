import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  insertHyroxRaceRecord,
  listHyroxRaceHistory,
  parseRaceDraft,
} from "@/app/lib/hyroxRaceIntelligenceServer";

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const { client } = await createCoachServerClient();
  const result = await listHyroxRaceHistory(client, auth.athlete.id);
  if (result.error) {
    return auth.withAuthCookies(
      NextResponse.json({ success: false, error: result.error }, { status: 500 })
    );
  }

  return auth.withAuthCookies(
    NextResponse.json({
      success: true,
      races: result.items,
    })
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const parsed = parseRaceDraft(await request.json().catch(() => null));
  if ("error" in parsed) {
    return auth.withAuthCookies(NextResponse.json({ success: false, error: parsed.error }, { status: 400 }));
  }

  const { client } = await createCoachServerClient();
  const saved = await insertHyroxRaceRecord(client, auth.athlete.id, parsed.draft);
  if (saved.error || !saved.item) {
    return auth.withAuthCookies(
      NextResponse.json({ success: false, error: saved.error ?? "Could not save race." }, { status: 500 })
    );
  }

  return auth.withAuthCookies(NextResponse.json({ success: true, race: saved.item }));
}
