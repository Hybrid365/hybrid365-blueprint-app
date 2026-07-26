import { NextResponse, type NextRequest } from "next/server";
import { resolveHyroxAthleteMutationActor } from "@/app/lib/hyroxAthleteMutationActor";
import {
  createApiRouteSupabase,
  hyroxAthleteApiJson,
} from "@/app/lib/supabase/apiRoute";
import { isHyroxPerformanceHubEnabled } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import { buildPerformanceHubPayload } from "@/app/lib/hyrox-team/modules/performanceHub/buildHubPayload";
import type { HubRangeKey } from "@/app/lib/hyrox-team/modules/performanceHub/types";

function parseRange(raw: string | null): HubRangeKey {
  if (raw === "last_4" || raw === "last_12") return raw;
  return "this_week";
}

export async function GET(request: NextRequest) {
  const { withAuthCookies } = await createApiRouteSupabase(request);
  const url = new URL(request.url);
  const rangeKey = parseRange(url.searchParams.get("range"));
  const timezone = url.searchParams.get("timezone") ?? "UTC";
  const expectedAthleteId = url.searchParams.get("expectedAthleteId");

  const actor = await resolveHyroxAthleteMutationActor({
    request,
    expectedAthleteId,
  });
  if (!actor.ok) {
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: actor.error, code: actor.code },
      actor.code === "NO_AUTH" ? 401 : 403
    );
  }

  if (!isHyroxPerformanceHubEnabled({ id: actor.athlete.id, email: actor.athlete.email })) {
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: "Performance Hub is not enabled for this athlete.", code: "FORBIDDEN" },
      403
    );
  }

  try {
    const hub = await buildPerformanceHubPayload(actor.writeClient, actor.athlete, {
      rangeKey,
      timezone,
    });
    return withAuthCookies(NextResponse.json({ success: true, hub }));
  } catch {
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: "Could not load Performance Hub.", code: "UNKNOWN" },
      500
    );
  }
}
