import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { isHyroxRaceIntelligenceEnabled } from "@/app/lib/hyroxRaceIntelligenceFlag";
import {
  insertHyroxRaceRecord,
  listHyroxRaceHistory,
  parseRaceDraft,
} from "@/app/lib/hyroxRaceIntelligenceServer";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!isHyroxRaceIntelligenceEnabled({ id })) {
    return NextResponse.json({ success: false, error: "Race intelligence is not enabled." }, { status: 404 });
  }
  const { client } = await createCoachServerClient();
  const result = await listHyroxRaceHistory(client, id);
  if (result.error) return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  return NextResponse.json({ success: true, races: result.items });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  if (!isHyroxRaceIntelligenceEnabled({ id })) {
    return NextResponse.json({ success: false, error: "Race intelligence is not enabled." }, { status: 404 });
  }
  const parsed = parseRaceDraft(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }
  const { client } = await createCoachServerClient();
  const saved = await insertHyroxRaceRecord(client, id, parsed.draft);
  if (saved.error || !saved.item) {
    return NextResponse.json({ success: false, error: saved.error ?? "Could not save race." }, { status: 500 });
  }
  return NextResponse.json({ success: true, race: saved.item });
}
