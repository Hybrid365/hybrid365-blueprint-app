import { NextResponse, type NextRequest } from "next/server";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  createApiRouteSupabase,
  hyroxAthleteApiJson,
  type ApiRouteAuthDebug,
} from "@/app/lib/supabase/apiRoute";
import { resolveAuthUserForMiddleware } from "@/app/lib/supabase/resolveAuthUser";

function devFields(extra: Record<string, unknown>): Record<string, unknown> {
  if (process.env.NODE_ENV !== "development") return {};
  return extra;
}

function logApiResolutionFailure(
  authEmail: string | null,
  authUserId: string | null,
  portal: Awaited<ReturnType<typeof resolveHyroxPortalAthlete>>,
  authDebug: ApiRouteAuthDebug
) {
  if (process.env.NODE_ENV !== "development") return;

  console.warn("[hyrox-api] athlete resolution failed", {
    authUserId,
    authEmail,
    accessReason: portal.accessReason,
    matchSource: portal.matchSource,
    athleteId: portal.athlete?.id ?? null,
    authDebug,
  });
}

/**
 * Athlete API guard — same resolution as app/athlete/layout.tsx.
 * Uses cookies() + request cookies (layout-aligned) and returns refreshed Set-Cookie headers.
 */
function portalContextAthleteAllowed(
  user: { id: string; email?: string | null },
  athlete: HyroxAthleteRow,
  expectedAthleteId: string
): boolean {
  if (athlete.id !== expectedAthleteId || athlete.payment_status !== "paid") return false;
  if (athlete.user_id === user.id) return true;
  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim().toLowerCase()
      : null;
  const athleteEmail =
    typeof athlete.email === "string" && athlete.email.trim()
      ? athlete.email.trim().toLowerCase()
      : null;
  return Boolean(email && athleteEmail && email === athleteEmail);
}

export async function requireCurrentHyroxAthleteForApi(
  request: NextRequest,
  options?: { expectedAthleteId?: string | null }
) {
  const { supabase, withAuthCookies, authDebug } =
    await createApiRouteSupabase(request);

  const hasAuthCookie =
    authDebug.hasAuthCookieOnRequest || authDebug.hasAuthCookieInHeaderStore;

  const { user, error: userError, retriedWithSession } =
    await resolveAuthUserForMiddleware(supabase, hasAuthCookie);

  authDebug.getUserSucceeded = Boolean(user);
  authDebug.userError = userError?.message ?? null;
  if (retriedWithSession && process.env.NODE_ENV === "development") {
    authDebug.cookiesRefreshed = true;
  }

  if (!user) {
    logHyroxAuthDebug("hyrox-api-no-user", {
      userError: userError?.message ?? null,
      authDebug,
    });
    return {
      error: hyroxAthleteApiJson(withAuthCookies, {
        success: false,
        error: "Not signed in",
        code: "NO_AUTH",
        source: "api",
        reason: "NO_AUTH_SESSION",
        authEmail: null,
        ...devFields({ authDebug }),
      }, 401),
    };
  }

  const authEmail = user.email?.trim().toLowerCase() ?? "";
  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  if (portal.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER") {
    logApiResolutionFailure(authEmail, user.id, portal, authDebug);
    return {
      error: hyroxAthleteApiJson(
        withAuthCookies,
        {
          error:
            "Your email matches a paid athlete profile linked to a different sign-in account. Ask your coach to relink your account.",
          code: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
          authEmail,
          reason: portal.accessReason,
          ...devFields({
            matchedAthleteId: portal.athlete?.id ?? null,
            matchSource: portal.matchSource,
            authDebug,
          }),
        },
        403
      ),
    };
  }

  const linked =
    portal.accessReason === "LINKED" &&
    portal.athlete?.payment_status === "paid" &&
    portal.athlete.user_id === user.id;

  let athlete = linked ? portal.athlete : null;

  if (
    !athlete &&
    options?.expectedAthleteId &&
    portal.athlete &&
    portalContextAthleteAllowed(user, portal.athlete, options.expectedAthleteId)
  ) {
    athlete = portal.athlete;
  }

  if (!athlete) {
    logApiResolutionFailure(authEmail, user.id, portal, authDebug);
    const reason = portal.accessReason ?? "NO_PAID_ATHLETE_FOUND";
    const message =
      reason === "UNLINKED_PAID"
        ? "Paid athlete profile found but not linked to this sign-in. Reload the page or ask your coach to link your account."
        : "No Hyrox athlete profile found for this login email";

    return {
      error: hyroxAthleteApiJson(
        withAuthCookies,
        {
          error: message,
          code: reason,
          authEmail,
          reason,
          ...devFields({
            matchedAthleteId: portal.athlete?.id ?? null,
            matchSource: portal.matchSource,
            autoLinked: portal.autoLinked,
            authDebug,
          }),
        },
        403
      ),
    };
  }

  logHyroxAuthDebug("hyrox-api-athlete-resolved", {
    authUserId: user.id,
    athleteId: athlete.id,
    matchSource: portal.matchSource,
    accessReason: portal.accessReason,
    autoLinked: portal.autoLinked,
    cookiesRefreshed: authDebug.cookiesRefreshed,
  });

  return { supabase, user, athlete: athlete as HyroxAthleteRow, withAuthCookies, authDebug };
}

/** @deprecated Use requireCurrentHyroxAthleteForApi */
export const requireLinkedHyroxAthleteApi = requireCurrentHyroxAthleteForApi;
