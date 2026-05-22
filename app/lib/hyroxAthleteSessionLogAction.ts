"use server";

import { resolveLinkedHyroxAthleteForServer } from "@/app/lib/hyroxAthletePortalServerAuth";
import {
  HyroxSessionLogError,
  upsertHyroxAthleteSessionLog,
  type HyroxSessionLogInput,
} from "@/app/lib/hyroxAthleteSessionLogServer";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import { createClient } from "@/app/lib/supabase/server";
import type { HyroxSession } from "@/app/lib/hyroxTeamDashboardMock";

export type HyroxSessionLogActionBody = {
  programmeSessionId: string;
  completed?: boolean;
  status?: "scheduled" | "completed" | "missed" | "modified";
  rpe?: string | number | null;
  notes?: string | null;
  modifications?: string | null;
  score?: string | null;
};

export type HyroxSessionLogActionResult = {
  success: boolean;
  error?: string;
  code?: string;
  message?: string;
  session?: HyroxSession | null;
  via?: "server";
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

/**
 * Session log mutation via Server Action — same Supabase cookies as layout.
 * Prefer this over client fetch when Route Handler cookie merge is unreliable.
 */
export async function saveHyroxAthleteSessionLogAction(
  body: HyroxSessionLogActionBody
): Promise<HyroxSessionLogActionResult> {
  const linked = await resolveLinkedHyroxAthleteForServer();
  if (!linked) {
    return {
      success: false,
      error:
        "Could not verify your athlete session. Reload the page and try again.",
      code: "NO_AUTH",
      via: "server",
    };
  }

  const input: HyroxSessionLogInput = {
    programmeSessionId: body.programmeSessionId?.trim() ?? "",
    completed: body.completed,
    status: body.status,
    feedback: feedbackFromBody(body),
  };

  const supabase = await createClient();

  try {
    const { session } = await upsertHyroxAthleteSessionLog(
      supabase,
      linked.athlete,
      input
    );
    const [uiSession] = mapPublishedSessionsToAthleteUi([session]);

    return {
      success: true,
      session: uiSession ?? null,
      message: input.completed
        ? "Session marked complete."
        : "Session log saved.",
      via: "server",
    };
  } catch (e) {
    if (e instanceof HyroxSessionLogError) {
      return {
        success: false,
        error: e.message,
        code: e.code,
        via: "server",
      };
    }
    const message = e instanceof Error ? e.message : "Could not save session log.";
    return { success: false, error: message, code: "UNKNOWN", via: "server" };
  }
}
