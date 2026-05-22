"use server";

import { revalidatePath } from "next/cache";
import {
  resolveHyroxAthleteMutationActor,
  type HyroxMutationActorDebug,
} from "@/app/lib/hyroxAthleteMutationActor";
import {
  HyroxSessionLogError,
  upsertHyroxAthleteSessionLog,
  type HyroxSessionLogInput,
} from "@/app/lib/hyroxAthleteSessionLogServer";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type HyroxSessionLogActionBody = {
  programmeSessionId: string;
  completed?: boolean;
  status?: "scheduled" | "completed" | "missed" | "modified";
  rpe?: string | number | null;
  notes?: string | null;
  modifications?: string | null;
  score?: string | null;
  /** Portal context athlete id — fallback when strict linked resolve fails but layout rendered. */
  expectedAthleteId?: string | null;
};

export type HyroxSessionLogActionResult = {
  success: boolean;
  error?: string;
  code?: string;
  message?: string;
  session?: HyroxSession | null;
  via?: "server" | "h365-athlete-session" | "supabase-cookie";
  authDebug?: HyroxMutationActorDebug;
};

function feedbackFromBody(
  body: HyroxSessionLogActionBody
): HyroxSessionLogInput["feedback"] {
  const hasField =
    body.rpe !== undefined ||
    body.notes !== undefined ||
    body.modifications !== undefined ||
    body.score !== undefined;
  if (!hasField) return undefined;
  return {
    rpe: body.rpe != null && body.rpe !== "" ? String(body.rpe) : null,
    notes: body.notes ?? null,
    modifications: body.modifications ?? null,
    score: body.score ?? null,
  };
}

export async function saveHyroxAthleteSessionLogAction(
  body: HyroxSessionLogActionBody
): Promise<HyroxSessionLogActionResult> {
  const actor = await resolveHyroxAthleteMutationActor({
    expectedAthleteId: body.expectedAthleteId ?? null,
    programmeSessionId: body.programmeSessionId?.trim() ?? null,
  });

  if (!actor.ok) {
    return {
      success: false,
      error: `[server action · ${actor.code}] ${actor.error}`,
      code: actor.code === "NO_AUTH" ? "NO_AUTH" : actor.code,
      via: "server",
      authDebug: actor.debug,
    };
  }

  const input: HyroxSessionLogInput = {
    programmeSessionId: body.programmeSessionId?.trim() ?? "",
    completed: body.completed,
    status: body.status,
    feedback: feedbackFromBody(body),
  };

  try {
    const { session } = await upsertHyroxAthleteSessionLog(
      actor.writeClient,
      actor.athlete,
      input
    );
    const [uiSession] = mapPublishedSessionsToAthleteUi([session]);

    revalidatePath("/athlete/dashboard");
    revalidatePath("/athlete/programme");

    return {
      success: true,
      session: uiSession ?? null,
      message: input.completed
        ? "Session marked complete."
        : "Session log saved.",
      via:
        actor.source === "h365-athlete-session"
          ? "h365-athlete-session"
          : actor.source === "supabase-cookie"
            ? "supabase-cookie"
            : "server",
      authDebug: actor.debug,
    };
  } catch (e) {
    if (e instanceof HyroxSessionLogError) {
      return {
        success: false,
        error: `[server action · ${e.code}] ${e.message}`,
        code: e.code,
        via: "server",
        authDebug: actor.debug,
      };
    }
    const message = e instanceof Error ? e.message : "Could not save session log.";
    return {
      success: false,
      error: `[server action] ${message}`,
      code: "UNKNOWN",
      via: "server",
      authDebug: actor.debug,
    };
  }
}
