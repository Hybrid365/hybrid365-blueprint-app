import { NextResponse, type NextRequest } from "next/server";
import { requireCurrentHyroxAthleteForApi } from "@/app/lib/hyroxAthleteApiAuth";
import { saveHyroxSessionLogViaPortalToken } from "@/app/lib/hyroxAthleteSessionLogTokenAuth";
import {
  createApiRouteSupabase,
  hyroxAthleteApiJson,
} from "@/app/lib/supabase/apiRoute";
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
  expectedAthleteId?: string | null;
  portalMutationToken?: string | null;
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

function devAuthFields(extra: Record<string, unknown>): Record<string, unknown> {
  if (process.env.NODE_ENV !== "development") return {};
  return extra;
}

export async function POST(request: NextRequest) {
  const { withAuthCookies } = await createApiRouteSupabase(request);

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

  const auth = await requireCurrentHyroxAthleteForApi(request, {
    expectedAthleteId: body.expectedAthleteId ?? null,
  });

  if (!auth.error) {
    try {
      const { session } = await upsertHyroxAthleteSessionLog(
        auth.supabase,
        auth.athlete,
        input
      );
      const [uiSession] = mapPublishedSessionsToAthleteUi([session]);

      return withAuthCookies(
        NextResponse.json({
          success: true,
          session: uiSession ?? null,
          message: input.completed
            ? "Session marked complete."
            : "Session log saved.",
          via: "api-cookie",
          cookieAuth: "succeeded",
          tokenAuth: body.portalMutationToken ? "not-needed" : "missing",
          ...devAuthFields({ authDebug: auth.authDebug }),
        })
      );
    } catch (e) {
      if (e instanceof HyroxSessionLogError) {
        const status =
          e.code === "NOT_FOUND"
            ? 404
            : e.code === "WEEK_LOCKED" || e.code === "FORBIDDEN"
              ? 403
              : 400;
        return hyroxAthleteApiJson(
          withAuthCookies,
          {
            success: false,
            error: e.message,
            code: e.code,
            via: "api-cookie",
            cookieAuth: "succeeded",
          },
          status
        );
      }
      const message = e instanceof Error ? e.message : "Could not save session log.";
      return hyroxAthleteApiJson(withAuthCookies, { success: false, error: message }, 500);
    }
  }

  if (body.portalMutationToken?.trim()) {
    const tokenResult = await saveHyroxSessionLogViaPortalToken(
      body.portalMutationToken,
      input,
      { expectedAthleteId: body.expectedAthleteId ?? null }
    );

    if (tokenResult.ok) {
      return withAuthCookies(
        NextResponse.json({
          success: true,
          session: tokenResult.session,
          message: tokenResult.message,
          via: "api-signed-token",
          cookieAuth: "failed",
          tokenAuth: "succeeded",
          athleteId: tokenResult.athleteId,
          sessionBelongsToAthlete: true,
          ...devAuthFields({
            expectedAthleteId: body.expectedAthleteId ?? null,
            programmeSessionId: input.programmeSessionId,
          }),
        })
      );
    }

    return hyroxAthleteApiJson(
      withAuthCookies,
      {
        success: false,
        error: tokenResult.error,
        code: tokenResult.code,
        via: "api-signed-token",
        cookieAuth: "failed",
        tokenAuth: tokenResult.tokenAuth,
        sessionBelongsToAthlete: tokenResult.sessionBelongsToAthlete,
        ...devAuthFields({
          expectedAthleteId: body.expectedAthleteId ?? null,
          programmeSessionId: input.programmeSessionId,
          verifyReason: tokenResult.verifyReason,
        }),
      },
      tokenResult.code === "SESSION_ATHLETE_MISMATCH" ||
        tokenResult.code === "TOKEN_ATHLETE_MISMATCH"
        ? 403
        : 401
    );
  }

  return hyroxAthleteApiJson(
    withAuthCookies,
    {
      success: false,
      error: "Not signed in",
      code: "NO_AUTH",
      via: "api-cookie",
      cookieAuth: "failed",
      tokenAuth: "missing",
      sessionBelongsToAthlete: false,
      ...devAuthFields({
        expectedAthleteId: body.expectedAthleteId ?? null,
        programmeSessionId: input.programmeSessionId,
      }),
    },
    401
  );
}
