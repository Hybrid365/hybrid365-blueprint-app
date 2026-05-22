import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { HYROX_ATHLETE_SELECT } from "@/app/lib/hyroxCurrentAthlete";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  verifyHyroxPortalMutationToken,
  type HyroxPortalMutationTokenVerifyFailure,
} from "@/app/lib/hyroxPortalMutationToken";
import {
  createApiRouteSupabase,
  hasValidSupabaseSessionCookies,
  type ApiRouteAuthDebug,
} from "@/app/lib/supabase/apiRoute";
import {
  readAthleteSessionCookieFromEntries,
  resolveSupabaseUserFromAthleteSession,
} from "@/app/lib/supabase/hyroxAthleteSessionCookie";
import {
  readAthletePortalCookies,
  readAthleteRouteHandlerCookies,
} from "@/app/lib/supabase/mergedAthleteCookies";
import {
  authCookiesPresent,
  resolveAuthUserForMiddleware,
} from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type HyroxMutationActorSource =
  | "supabase-cookie"
  | "h365-athlete-session"
  | "portal-mutation-token";

export type HyroxMutationActorAuthStatus =
  | "succeeded"
  | "failed"
  | "invalid"
  | "missing"
  | "expired"
  | "mismatch"
  | "not-attempted";

export type HyroxMutationActorDebug = {
  cookieAuth: HyroxMutationActorAuthStatus;
  h365AthleteSession: "valid" | "invalid" | "missing" | "not-attempted";
  tokenAuth: HyroxMutationActorAuthStatus;
  source: HyroxMutationActorSource | "none";
  authUserId: string | null;
  email: string | null;
  athleteId: string | null;
  expectedAthleteId: string | null;
  accessReason: string | null;
  matchSource: string | null;
  tokenVerifyReason?: HyroxPortalMutationTokenVerifyFailure;
};

export type HyroxMutationActorResult =
  | {
      ok: true;
      source: HyroxMutationActorSource;
      authUserId: string;
      email: string | null;
      user: User;
      athlete: HyroxAthleteRow;
      /** Prefer coach/service-role client for writes when sb cookies are absent. */
      writeClient: SupabaseClient;
      debug: HyroxMutationActorDebug;
      apiAuthDebug?: ApiRouteAuthDebug;
    }
  | {
      ok: false;
      code:
        | "NO_AUTH"
        | "NO_USER"
        | "NO_ATHLETE"
        | "NOT_PAID"
        | "TOKEN_INVALID"
        | "SESSION_NOT_OWNED";
      error: string;
      debug: HyroxMutationActorDebug;
      apiAuthDebug?: ApiRouteAuthDebug;
    };

/** Safe email normalization — never calls toLowerCase on undefined. */
export function normalizeOptionalEmail(
  value: string | null | undefined
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function emailsMatchSafe(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeOptionalEmail(a);
  const right = normalizeOptionalEmail(b);
  return Boolean(left && right && left === right);
}

async function resolveLinkedAthleteForUser(
  user: User,
  expectedAthleteId: string | null,
  supabase: SupabaseClient
): Promise<
  | { ok: true; athlete: HyroxAthleteRow; accessReason: string | null; matchSource: string }
  | { ok: false; code: "NO_ATHLETE" | "NOT_PAID"; error: string; accessReason: string | null; matchSource: string | null; athleteId: string | null }
> {
  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  const athlete = portal.athlete;
  const accessReason = portal.accessReason ?? null;
  const matchSource = portal.matchSource;
  const athleteId = athlete?.id ?? null;

  const strictlyLinked =
    portal.accessReason === "LINKED" &&
    athlete?.payment_status === "paid" &&
    athlete.user_id === user.id;

  if (strictlyLinked && athlete) {
    return { ok: true, athlete, accessReason, matchSource };
  }

  if (
    expectedAthleteId &&
    athlete?.id === expectedAthleteId &&
    athlete.payment_status === "paid" &&
    (athlete.user_id === user.id || emailsMatchSafe(athlete.email, user.email))
  ) {
    return { ok: true, athlete, accessReason, matchSource };
  }

  if (athlete && athlete.payment_status !== "paid") {
    return {
      ok: false,
      code: "NOT_PAID",
      error: "Athlete profile is not marked as paid.",
      accessReason,
      matchSource,
      athleteId,
    };
  }

  return {
    ok: false,
    code: "NO_ATHLETE",
    error:
      portal.accessReason === "UNLINKED_PAID"
        ? "Paid athlete profile found but not linked to this sign-in."
        : "No linked Hyrox athlete profile for this login.",
    accessReason,
    matchSource,
    athleteId,
  };
}

async function assertProgrammeSessionOwnedByAthlete(
  client: SupabaseClient,
  programmeSessionId: string,
  athleteId: string
): Promise<{ ok: true } | { ok: false }> {
  const { data: sessionRow } = await client
    .from("hyrox_programme_sessions")
    .select("id, athlete_id")
    .eq("id", programmeSessionId)
    .maybeSingle();

  if (!sessionRow || sessionRow.athlete_id !== athleteId) {
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Resolve athlete mutation actor — Supabase cookies, then h365_athlete_session, then portal token.
 */
export async function resolveHyroxAthleteMutationActor(input: {
  request?: NextRequest;
  portalMutationToken?: string | null;
  expectedAthleteId?: string | null;
  programmeSessionId?: string | null;
}): Promise<HyroxMutationActorResult> {
  const expectedAthleteId = input.expectedAthleteId?.trim() || null;
  const programmeSessionId = input.programmeSessionId?.trim() || null;

  const debug: HyroxMutationActorDebug = {
    cookieAuth: "not-attempted",
    h365AthleteSession: "not-attempted",
    tokenAuth: input.portalMutationToken?.trim() ? "not-attempted" : "missing",
    source: "none",
    authUserId: null,
    email: null,
    athleteId: null,
    expectedAthleteId,
    accessReason: null,
    matchSource: null,
  };

  let mergedCookies: { name: string; value: string }[] = [];
  let apiAuthDebug: ApiRouteAuthDebug | undefined;

  if (input.request) {
    const { cookies: merged } = await readAthleteRouteHandlerCookies(input.request);
    mergedCookies = merged;
    const api = await createApiRouteSupabase(input.request);
    apiAuthDebug = api.authDebug;

    const hasAuthCookie =
      apiAuthDebug.hasAuthCookieOnRequest || apiAuthDebug.hasAuthCookieInHeaderStore;

    debug.cookieAuth = "failed";
    const { user, error: userError } = await resolveAuthUserForMiddleware(
      api.supabase,
      hasAuthCookie
    );
    apiAuthDebug.getUserSucceeded = Boolean(user);
    apiAuthDebug.userError = userError?.message ?? null;

    if (user && hasValidSupabaseSessionCookies(mergedCookies)) {
      const linked = await resolveLinkedAthleteForUser(user, expectedAthleteId, api.supabase);
      debug.authUserId = user.id;
      debug.email = normalizeOptionalEmail(user.email);
      debug.accessReason = linked.ok ? linked.accessReason : linked.accessReason;
      debug.matchSource = linked.ok ? linked.matchSource : linked.matchSource;
      debug.athleteId = linked.ok ? linked.athlete.id : linked.athleteId;

      if (linked.ok) {
        if (programmeSessionId) {
          const owned = await assertProgrammeSessionOwnedByAthlete(
            api.supabase,
            programmeSessionId,
            linked.athlete.id
          );
          if (!owned.ok) {
            return {
              ok: false,
              code: "SESSION_NOT_OWNED",
              error: "Session does not belong to the signed-in athlete.",
              debug: { ...debug, cookieAuth: "succeeded", source: "supabase-cookie" },
              apiAuthDebug,
            };
          }
        }
        debug.cookieAuth = "succeeded";
        debug.source = "supabase-cookie";
        return {
          ok: true,
          source: "supabase-cookie",
          authUserId: user.id,
          email: debug.email,
          user,
          athlete: linked.athlete,
          writeClient: api.supabase,
          debug,
          apiAuthDebug,
        };
      }
    } else if (user) {
      debug.cookieAuth = "failed";
    } else {
      debug.cookieAuth = hasAuthCookie ? "failed" : "failed";
    }
  } else {
    const { cookies: merged } = await readAthletePortalCookies();
    mergedCookies = merged;
    const cookieStore = await cookies();
    const hasAuthCookie = authCookiesPresent(cookieStore.getAll());
    const supabase = await createClient();
    debug.cookieAuth = "failed";

    const { user } = await resolveAuthUserForMiddleware(supabase, hasAuthCookie);
    if (user && hasValidSupabaseSessionCookies(mergedCookies)) {
      const linked = await resolveLinkedAthleteForUser(user, expectedAthleteId, supabase);
      debug.authUserId = user.id;
      debug.email = normalizeOptionalEmail(user.email);
      debug.accessReason = linked.ok ? linked.accessReason : linked.accessReason;
      debug.matchSource = linked.ok ? linked.matchSource : linked.matchSource;
      debug.athleteId = linked.ok ? linked.athlete.id : linked.athleteId;

      if (linked.ok) {
        if (programmeSessionId) {
          const { client } = await createCoachServerClient();
          const owned = await assertProgrammeSessionOwnedByAthlete(
            client,
            programmeSessionId,
            linked.athlete.id
          );
          if (!owned.ok) {
            return {
              ok: false,
              code: "SESSION_NOT_OWNED",
              error: "Session does not belong to the signed-in athlete.",
              debug: { ...debug, cookieAuth: "succeeded", source: "supabase-cookie" },
            };
          }
        }
        debug.cookieAuth = "succeeded";
        debug.source = "supabase-cookie";
        return {
          ok: true,
          source: "supabase-cookie",
          authUserId: user.id,
          email: debug.email,
          user,
          athlete: linked.athlete,
          writeClient: supabase,
          debug,
        };
      }
    }
  }

  debug.h365AthleteSession = "missing";
  const athleteSessionPayload = readAthleteSessionCookieFromEntries(mergedCookies);
  if (athleteSessionPayload) {
    debug.h365AthleteSession = "invalid";
    const user = await resolveSupabaseUserFromAthleteSession(athleteSessionPayload);
    if (user) {
      debug.h365AthleteSession = "valid";
      debug.authUserId = user.id;
      debug.email =
        normalizeOptionalEmail(user.email) ??
        normalizeOptionalEmail(athleteSessionPayload.email);

      const { client: writeClient } = await createCoachServerClient();
      const linked = await resolveLinkedAthleteForUser(user, expectedAthleteId, writeClient);
      debug.accessReason = linked.ok ? linked.accessReason : linked.accessReason;
      debug.matchSource = linked.ok ? linked.matchSource : linked.matchSource;
      debug.athleteId = linked.ok ? linked.athlete.id : linked.athleteId;

      if (linked.ok) {
        if (programmeSessionId) {
          const owned = await assertProgrammeSessionOwnedByAthlete(
            writeClient,
            programmeSessionId,
            linked.athlete.id
          );
          if (!owned.ok) {
            return {
              ok: false,
              code: "SESSION_NOT_OWNED",
              error: "Session does not belong to the signed-in athlete.",
              debug: {
                ...debug,
                source: "h365-athlete-session",
              },
              apiAuthDebug,
            };
          }
        }
        debug.source = "h365-athlete-session";
        return {
          ok: true,
          source: "h365-athlete-session",
          authUserId: user.id,
          email: debug.email,
          user,
          athlete: linked.athlete,
          writeClient,
          debug,
          apiAuthDebug,
        };
      }
    }
  }

  const token = input.portalMutationToken?.trim();
  if (token) {
    debug.tokenAuth = "invalid";
    const verified = verifyHyroxPortalMutationToken(token);
    if (!verified.ok) {
      debug.tokenAuth =
        verified.reason === "expired" ? "expired" : "invalid";
      debug.tokenVerifyReason = verified.reason;
      return {
        ok: false,
        code: "TOKEN_INVALID",
        error: `Signed portal token ${verified.reason}.`,
        debug,
        apiAuthDebug,
      };
    }

    const { payload } = verified;
    if (expectedAthleteId && expectedAthleteId !== payload.athleteId) {
      debug.tokenAuth = "mismatch";
      return {
        ok: false,
        code: "TOKEN_INVALID",
        error: "Signed portal token athlete does not match portal context.",
        debug,
        apiAuthDebug,
      };
    }

    const { client: writeClient } = await createCoachServerClient();
    const { data: athleteRow } = await writeClient
      .from("hyrox_athletes")
      .select(HYROX_ATHLETE_SELECT)
      .eq("id", payload.athleteId)
      .maybeSingle();

    const athlete = athleteRow as HyroxAthleteRow | null;
    if (!athlete || athlete.payment_status !== "paid") {
      debug.tokenAuth = "invalid";
      return {
        ok: false,
        code: "NO_ATHLETE",
        error: "Token athlete profile not found or not paid.",
        debug: { ...debug, athleteId: payload.athleteId },
        apiAuthDebug,
      };
    }

    debug.athleteId = athlete.id;
    debug.authUserId = payload.authUserId;
    debug.email = normalizeOptionalEmail(payload.email);

    if (programmeSessionId) {
      const owned = await assertProgrammeSessionOwnedByAthlete(
        writeClient,
        programmeSessionId,
        athlete.id
      );
      if (!owned.ok) {
        debug.tokenAuth = "mismatch";
        return {
          ok: false,
          code: "SESSION_NOT_OWNED",
          error: "Session does not belong to the verified athlete.",
          debug: { ...debug, source: "portal-mutation-token" },
          apiAuthDebug,
        };
      }
    }

    debug.tokenAuth = "succeeded";
    debug.source = "portal-mutation-token";
    const syntheticUser = {
      id: payload.authUserId ?? athlete.user_id ?? athlete.id,
      email: debug.email,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "",
    } as User;

    return {
      ok: true,
      source: "portal-mutation-token",
      authUserId: syntheticUser.id,
      email: debug.email,
      user: syntheticUser,
      athlete,
      writeClient,
      debug,
      apiAuthDebug,
    };
  }

  return {
    ok: false,
    code: "NO_AUTH",
    error: "Not signed in",
    debug,
    apiAuthDebug,
  };
}
