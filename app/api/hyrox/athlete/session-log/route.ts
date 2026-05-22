import { NextResponse, type NextRequest } from "next/server";
import {
  resolveHyroxAthleteMutationActor,
  type HyroxMutationActorSource,
} from "@/app/lib/hyroxAthleteMutationActor";
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

function viaFromSource(source: HyroxMutationActorSource): string {
  if (source === "supabase-cookie") return "api-cookie";
  if (source === "h365-athlete-session") return "h365-athlete-session";
  return "api-signed-token";
}

function failureStatus(code: string): number {
  if (code === "SESSION_NOT_OWNED") return 403;
  if (code === "NOT_FOUND") return 404;
  if (code === "WEEK_LOCKED" || code === "FORBIDDEN") return 403;
  if (code === "TOKEN_INVALID" || code === "NO_AUTH") return 401;
  if (code === "NO_ATHLETE" || code === "NOT_PAID") return 403;
  return 500;
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

  const actor = await resolveHyroxAthleteMutationActor({
    request,
    portalMutationToken: body.portalMutationToken ?? null,
    expectedAthleteId: body.expectedAthleteId ?? null,
    programmeSessionId: input.programmeSessionId,
  });

  if (!actor.ok) {
    const d = actor.debug;
    return hyroxAthleteApiJson(
      withAuthCookies,
      {
        success: false,
        error: actor.error,
        code: actor.code,
        via: d.source === "none" ? "api-cookie" : viaFromSource(d.source as HyroxMutationActorSource),
        cookieAuth: d.cookieAuth,
        h365AthleteSession: d.h365AthleteSession,
        tokenAuth: d.tokenAuth,
        sessionBelongsToAthlete: actor.code !== "SESSION_NOT_OWNED",
        athleteId: d.athleteId,
        ...devAuthFields({
          expectedAthleteId: body.expectedAthleteId ?? null,
          programmeSessionId: input.programmeSessionId,
          authUserId: d.authUserId,
          tokenVerifyReason: d.tokenVerifyReason,
          authDebug: actor.apiAuthDebug,
        }),
      },
      failureStatus(actor.code)
    );
  }

  try {
    const { session } = await upsertHyroxAthleteSessionLog(
      actor.writeClient,
      actor.athlete,
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
        via: viaFromSource(actor.source),
        cookieAuth: actor.debug.cookieAuth,
        h365AthleteSession: actor.debug.h365AthleteSession,
        tokenAuth: actor.debug.tokenAuth,
        athleteId: actor.athlete.id,
        sessionBelongsToAthlete: true,
        saved: true,
        ...devAuthFields({ authDebug: actor.apiAuthDebug }),
      })
    );
  } catch (e) {
    if (e instanceof HyroxSessionLogError) {
      return hyroxAthleteApiJson(
        withAuthCookies,
        {
          success: false,
          error: e.message,
          code: e.code,
          via: viaFromSource(actor.source),
          cookieAuth: actor.debug.cookieAuth,
          h365AthleteSession: actor.debug.h365AthleteSession,
          tokenAuth: actor.debug.tokenAuth,
          athleteId: actor.athlete.id,
          sessionBelongsToAthlete: e.code !== "NOT_FOUND",
        },
        failureStatus(e.code)
      );
    }
    const message = e instanceof Error ? e.message : "Could not save session log.";
    return hyroxAthleteApiJson(
      withAuthCookies,
      {
        success: false,
        error: message,
        code: "UNKNOWN",
        via: viaFromSource(actor.source),
        cookieAuth: actor.debug.cookieAuth,
        h365AthleteSession: actor.debug.h365AthleteSession,
        tokenAuth: actor.debug.tokenAuth,
        athleteId: actor.athlete.id,
        sessionBelongsToAthlete: false,
      },
      500
    );
  }
}
