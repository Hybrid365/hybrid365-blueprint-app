"use server";

import { revalidatePath } from "next/cache";
import { resolveHyroxAthleteMutationActor } from "@/app/lib/hyroxAthleteMutationActor";
import {
  acknowledgeCoachNoteToday,
  fetchDailyReadinessForDate,
  localDateYmdInTimeZone,
  upsertDailyReadiness,
  HyroxDailyReadinessError,
  type DailyReadinessSubmitInput,
  type HyroxDailyReadinessRow,
} from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";

export type SaveDailyReadinessResult = {
  success: boolean;
  error?: string;
  code?: string;
  readiness?: HyroxDailyReadinessRow | null;
};

export async function saveHyroxDailyReadinessAction(
  body: DailyReadinessSubmitInput & { expectedAthleteId?: string | null }
): Promise<SaveDailyReadinessResult> {
  const actor = await resolveHyroxAthleteMutationActor({
    expectedAthleteId: body.expectedAthleteId ?? null,
  });
  if (!actor.ok) {
    return { success: false, error: actor.error, code: actor.code };
  }

  try {
    const readiness = await upsertDailyReadiness(actor.writeClient, actor.athlete, body);
    revalidatePath("/athlete/dashboard");
    return { success: true, readiness };
  } catch (e) {
    if (e instanceof HyroxDailyReadinessError) {
      return { success: false, error: e.message, code: e.code };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not save readiness.",
      code: "UNKNOWN",
    };
  }
}

export async function fetchHyroxDailyReadinessAction(params: {
  expectedAthleteId?: string | null;
  localDate?: string;
  timezone?: string;
}): Promise<SaveDailyReadinessResult> {
  const actor = await resolveHyroxAthleteMutationActor({
    expectedAthleteId: params.expectedAthleteId ?? null,
  });
  if (!actor.ok) {
    return { success: false, error: actor.error, code: actor.code };
  }
  const tz = params.timezone?.trim() || "UTC";
  const localDate =
    params.localDate?.trim() || localDateYmdInTimeZone(new Date(), tz);
  try {
    const readiness = await fetchDailyReadinessForDate(
      actor.writeClient,
      actor.athlete.id,
      localDate
    );
    return { success: true, readiness };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not load readiness.",
      code: "UNKNOWN",
    };
  }
}

export async function acknowledgeHyroxCoachNoteTodayAction(params: {
  expectedAthleteId?: string | null;
  localDate?: string;
  timezone?: string;
}): Promise<SaveDailyReadinessResult> {
  const actor = await resolveHyroxAthleteMutationActor({
    expectedAthleteId: params.expectedAthleteId ?? null,
  });
  if (!actor.ok) {
    return { success: false, error: actor.error, code: actor.code };
  }
  try {
    const readiness = await acknowledgeCoachNoteToday(actor.writeClient, actor.athlete, {
      localDate: params.localDate,
      timezone: params.timezone,
    });
    revalidatePath("/athlete/dashboard");
    return { success: true, readiness };
  } catch (e) {
    if (e instanceof HyroxDailyReadinessError) {
      return { success: false, error: e.message, code: e.code };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Could not acknowledge note.",
      code: "UNKNOWN",
    };
  }
}
