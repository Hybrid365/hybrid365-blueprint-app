import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { buildPerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/buildHubPayload";
import type { HubRangeKey } from "@/app/lib/hyrox-team/modules/performanceHub/types";

type RouteContext = { params: Promise<{ id: string }> };

function parseRange(raw: string | null): HubRangeKey {
  if (raw === "last_4" || raw === "last_12") return raw;
  return "this_week";
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const url = new URL(request.url);
  const rangeKey = parseRange(url.searchParams.get("range"));
  const timezone = url.searchParams.get("timezone") ?? "Europe/London";

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error: fetchError } = await fetchHyroxAthleteById(supabase, id);
  if (fetchError) {
    return NextResponse.json({ success: false, error: "Could not load athlete." }, { status: 500 });
  }
  if (!athlete) {
    return NextResponse.json({ success: false, error: "Athlete not found." }, { status: 404 });
  }

  try {
    const hub = await buildPerformanceHubPayload(supabase, athlete as HyroxAthleteRow, {
      rangeKey,
      timezone,
    });
    if (url.searchParams.get("full") === "1") {
      return NextResponse.json({
        success: true,
        hub,
      });
    }
    return NextResponse.json({
      success: true,
      range: hub.range,
      coachFlags: hub.coachFlags,
      summary: hub.summary.slice(0, 8),
      plannedVsCompleted: hub.plannedVsCompleted,
      readiness: hub.readiness,
      insights: hub.insights.slice(0, 3),
      dataNotes: hub.dataNotes,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load performance summary." },
      { status: 500 }
    );
  }
}
