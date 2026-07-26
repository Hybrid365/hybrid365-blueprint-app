import { NextResponse, type NextRequest } from "next/server";
import {
  resolveHyroxAthleteMutationActor,
} from "@/app/lib/hyroxAthleteMutationActor";
import {
  createApiRouteSupabase,
  hyroxAthleteApiJson,
} from "@/app/lib/supabase/apiRoute";
import {
  fetchDailyReadinessForDate,
  localDateYmdInTimeZone,
  upsertDailyReadiness,
  HyroxDailyReadinessError,
} from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";

type Body = {
  sleepQuality?: number | null;
  energy?: number | null;
  motivation?: number | null;
  stress?: number | null;
  muscleSoreness?: number | null;
  feelingUnwell?: boolean;
  bodyweight?: number | null;
  restingHr?: number | null;
  localDate?: string;
  timezone?: string;
  expectedAthleteId?: string | null;
  portalMutationToken?: string | null;
};

export async function GET(request: NextRequest) {
  const { withAuthCookies } = await createApiRouteSupabase(request);
  const url = new URL(request.url);
  const timezone = url.searchParams.get("timezone") ?? "UTC";
  const localDate =
    url.searchParams.get("localDate") ??
    localDateYmdInTimeZone(new Date(), timezone);
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

  try {
    const readiness = await fetchDailyReadinessForDate(
      actor.writeClient,
      actor.athlete.id,
      localDate
    );
    return withAuthCookies(NextResponse.json({ success: true, readiness, localDate }));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load readiness.";
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, 500);
  }
}

export async function POST(request: NextRequest) {
  const { withAuthCookies } = await createApiRouteSupabase(request);
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: "Invalid JSON." }, 400);
  }

  const actor = await resolveHyroxAthleteMutationActor({
    request,
    portalMutationToken: body.portalMutationToken ?? null,
    expectedAthleteId: body.expectedAthleteId ?? null,
  });
  if (!actor.ok) {
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: actor.error, code: actor.code },
      actor.code === "NO_AUTH" ? 401 : 403
    );
  }

  try {
    const readiness = await upsertDailyReadiness(actor.writeClient, actor.athlete, body);
    return withAuthCookies(
      NextResponse.json({
        success: true,
        readiness,
        message: "Readiness saved. Your coach can now review today’s check-in.",
      })
    );
  } catch (e) {
    if (e instanceof HyroxDailyReadinessError) {
      return hyroxAthleteApiJson(
        withAuthCookies,
        { success: false, error: e.message, code: e.code },
        400
      );
    }
    const message = e instanceof Error ? e.message : "Could not save readiness.";
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, 500);
  }
}
