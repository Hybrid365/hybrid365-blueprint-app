import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import {
  buildAthleteCheckInSummary,
  buildAthleteWeeklyCheckInForProgramme,
  upsertAthleteWeeklyCheckIn,
  type CheckInSubmitInput,
} from "@/app/lib/hyroxAthleteCheckInServer";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { fetchAthletePublishedProgramme } from "@/app/lib/hyroxProgrammeServer";
import { hyroxAthleteApiJson } from "@/app/lib/supabase/apiRoute";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function failureStatus(code: string): number {
  if (code === "CHECK_IN_LOCKED" || code === "CHECK_IN_ALREADY_SUBMITTED") return 403;
  return 500;
}

export async function GET(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const { athlete, withAuthCookies } = auth;
  const { client: supabase } = await createCoachServerClient();

  try {
    const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
    const programme = await fetchAthletePublishedProgramme(supabase, athlete, flags);
    const view = await buildAthleteWeeklyCheckInForProgramme(supabase, athlete, programme);
    const summary = buildAthleteCheckInSummary(view);

    return hyroxAthleteApiJson(withAuthCookies, {
      success: true,
      checkIn: view,
      summary,
      published: programme.published,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load check-in.";
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: message },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  let body: Partial<CheckInSubmitInput>;
  try {
    body = (await request.json()) as Partial<CheckInSubmitInput>;
  } catch {
    return hyroxAthleteApiJson(
      auth.withAuthCookies,
      { success: false, error: "Invalid JSON body." },
      400
    );
  }

  const input: CheckInSubmitInput = {
    sleep: Number(body.sleep),
    energy: Number(body.energy),
    stress: Number(body.stress),
    soreness: Number(body.soreness),
    recovery: Number(body.recovery ?? body.stress),
    bodyweight: body.bodyweight != null ? Number(body.bodyweight) : null,
    painNiggles: body.painNiggles ?? "",
    biggestWin: body.biggestWin ?? "",
    biggestStruggle: body.biggestStruggle ?? "",
    nextWeekAvailability: body.nextWeekAvailability ?? "",
  };

  for (const key of ["sleep", "energy", "stress", "soreness", "recovery"] as const) {
    const v = input[key];
    if (!Number.isFinite(v) || v < 1 || v > 10) {
      return hyroxAthleteApiJson(
        auth.withAuthCookies,
        { success: false, error: `${key} must be between 1 and 10.` },
        400
      );
    }
  }

  const { athlete, withAuthCookies } = auth;
  const { client: supabase } = await createCoachServerClient();

  try {
    const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
    const programme = await fetchAthletePublishedProgramme(supabase, athlete, flags);
    const { view } = await upsertAthleteWeeklyCheckIn(supabase, {
      athlete,
      programme,
      input,
    });
    const summary = buildAthleteCheckInSummary(view);

    return hyroxAthleteApiJson(withAuthCookies, {
      success: true,
      checkIn: view,
      summary,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save check-in.";
    const code = e instanceof Error ? e.message : "";
    return hyroxAthleteApiJson(
      withAuthCookies,
      { success: false, error: message, code },
      failureStatus(code)
    );
  }
}
