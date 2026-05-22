import { revalidatePath } from "next/cache";
import { HYROX_ATHLETE_SELECT } from "@/app/lib/hyroxCurrentAthlete";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import {
  HyroxSessionLogError,
  upsertHyroxAthleteSessionLog,
  type HyroxSessionLogInput,
} from "@/app/lib/hyroxAthleteSessionLogServer";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  verifyHyroxPortalMutationToken,
  type HyroxPortalMutationTokenVerifyFailure,
} from "@/app/lib/hyroxPortalMutationToken";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type SessionLogTokenAuthStatus =
  | "missing"
  | "invalid"
  | "expired"
  | "mismatch"
  | "succeeded";

export type SessionLogViaPortalTokenResult =
  | {
      ok: true;
      session: HyroxSession | null;
      message: string;
      athleteId: string;
      sessionBelongsToAthlete: true;
      tokenAuth: "succeeded";
    }
  | {
      ok: false;
      tokenAuth: SessionLogTokenAuthStatus;
      error: string;
      code: string;
      sessionBelongsToAthlete: boolean;
      verifyReason?: HyroxPortalMutationTokenVerifyFailure;
    };

async function loadPaidAthleteById(athleteId: string): Promise<HyroxAthleteRow | null> {
  const { client } = await createCoachServerClient();
  const { data, error } = await client
    .from("hyrox_athletes")
    .select(HYROX_ATHLETE_SELECT)
    .eq("id", athleteId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as HyroxAthleteRow;
  if (row.payment_status !== "paid") return null;
  return row;
}

/** Verify layout-issued token and persist session log with scoped service-role update. */
export async function saveHyroxSessionLogViaPortalToken(
  portalMutationToken: string,
  input: HyroxSessionLogInput,
  options?: { expectedAthleteId?: string | null }
): Promise<SessionLogViaPortalTokenResult> {
  const verified = verifyHyroxPortalMutationToken(portalMutationToken);
  if (!verified.ok) {
    const status: SessionLogTokenAuthStatus =
      verified.reason === "expired" ? "expired" : "invalid";
    return {
      ok: false,
      tokenAuth: status,
      error: `Signed portal token ${verified.reason}.`,
      code: "TOKEN_INVALID",
      sessionBelongsToAthlete: false,
      verifyReason: verified.reason,
    };
  }

  const { payload } = verified;
  const expected = options?.expectedAthleteId?.trim();

  if (expected && expected !== payload.athleteId) {
    return {
      ok: false,
      tokenAuth: "mismatch",
      error: "Signed portal token athlete does not match portal context.",
      code: "TOKEN_ATHLETE_MISMATCH",
      sessionBelongsToAthlete: false,
    };
  }

  const athlete = await loadPaidAthleteById(payload.athleteId);
  if (!athlete) {
    return {
      ok: false,
      tokenAuth: "invalid",
      error: "Token athlete profile not found or not paid.",
      code: "TOKEN_ATHLETE_NOT_FOUND",
      sessionBelongsToAthlete: false,
    };
  }

  const { client } = await createCoachServerClient();

  const { data: sessionRow } = await client
    .from("hyrox_programme_sessions")
    .select("id, athlete_id")
    .eq("id", input.programmeSessionId)
    .maybeSingle();

  if (!sessionRow || sessionRow.athlete_id !== athlete.id) {
    return {
      ok: false,
      tokenAuth: "mismatch",
      error: "Session does not belong to the verified athlete.",
      code: "SESSION_ATHLETE_MISMATCH",
      sessionBelongsToAthlete: false,
    };
  }

  try {
    const { session } = await upsertHyroxAthleteSessionLog(client, athlete, input);
    const [uiSession] = mapPublishedSessionsToAthleteUi([session]);

    revalidatePath("/athlete/dashboard");
    revalidatePath("/athlete/programme");

    return {
      ok: true,
      session: uiSession ?? null,
      message: input.completed
        ? "Session marked complete."
        : "Session log saved.",
      athleteId: athlete.id,
      sessionBelongsToAthlete: true,
      tokenAuth: "succeeded",
    };
  } catch (e) {
    if (e instanceof HyroxSessionLogError) {
      return {
        ok: false,
        tokenAuth: "invalid",
        error: e.message,
        code: e.code,
        sessionBelongsToAthlete: true,
      };
    }
    const message = e instanceof Error ? e.message : "Could not save session log.";
    return {
      ok: false,
      tokenAuth: "invalid",
      error: message,
      code: "UNKNOWN",
      sessionBelongsToAthlete: true,
    };
  }
}
