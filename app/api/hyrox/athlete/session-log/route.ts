import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { hyroxAthleteApiJson } from "@/app/lib/supabase/apiRoute";
import {
  HyroxSessionLogError,
  upsertHyroxAthleteSessionLog,
  type HyroxSessionLogInput,
} from "@/app/lib/hyroxAthleteSessionLogServer";
import { mapPublishedSessionsToAthleteUi } from "@/app/lib/hyroxProgrammeServer";
import type { HyroxAthleteSessionFeedback } from "@/app/lib/hyroxAthleteSessionFeedback";

type SessionLogBody = {
  programmeSessionId?: string;
  completed?: boolean;
  status?: "scheduled" | "completed" | "missed" | "modified";
  rpe?: string | number | null;
  notes?: string | null;
  modifications?: string | null;
  score?: string | null;
};

function feedbackFromBody(body: SessionLogBody): HyroxAthleteSessionFeedback | undefined {
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

export async function POST(request: NextRequest) {
  const auth = await requireCurrentHyroxAthleteForApi(request);
  if (auth.error) return auth.error;

  const { withAuthCookies } = auth;

  let body: SessionLogBody;
  try {
    body = (await request.json()) as SessionLogBody;
  } catch {
    return hyroxAthleteApiJson(withAuthCookies, {
      success: false,
      error: "Invalid JSON body.",
    }, 400);
  }

  const input: HyroxSessionLogInput = {
    programmeSessionId: body.programmeSessionId?.trim() ?? "",
    completed: body.completed,
    status: body.status,
    feedback: feedbackFromBody(body),
  };

  try {
    const { session } = await upsertHyroxAthleteSessionLog(auth.supabase, auth.athlete, input);
    const [uiSession] = mapPublishedSessionsToAthleteUi([session]);

    return withAuthCookies(
      NextResponse.json({
        success: true,
        session: uiSession ?? null,
        message: input.completed
          ? "Session marked complete."
          : "Session log saved.",
      })
    );
  } catch (e) {
    if (e instanceof HyroxSessionLogError) {
      const status =
        e.code === "NOT_FOUND" ? 404 : e.code === "WEEK_LOCKED" || e.code === "FORBIDDEN" ? 403 : 400;
      return hyroxAthleteApiJson(withAuthCookies, {
        success: false,
        error: e.message,
        code: e.code,
      }, status);
    }
    const message = e instanceof Error ? e.message : "Could not save session log.";
    return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, 500);
  }
}
