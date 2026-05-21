import { NextResponse } from "next/server";
import {
  evaluateAthleteEmailAccess,
  isAthletePortalLinked,
} from "@/app/lib/hyroxAthleteAutoLink";
import { logHyroxAuthDebug } from "@/app/lib/hyroxAuthDebug";
import { resolveCurrentHyroxAthlete } from "@/app/lib/hyroxCurrentAthlete";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { createClient } from "@/app/lib/supabase/server";

function logApiResolutionFailure(
  user: { id: string; email?: string | null },
  resolved: Awaited<ReturnType<typeof resolveCurrentHyroxAthlete>>,
  emailAccess: Awaited<ReturnType<typeof evaluateAthleteEmailAccess>> | null
) {
  if (process.env.NODE_ENV !== "development") return;

  console.warn("[hyrox-api] athlete resolution failed", {
    authUserId: user.id,
    authEmail: user.email ?? null,
    foundByUserId: resolved.foundByUserId,
    foundByEmail: resolved.foundByEmail,
    athleteFoundByUserId: resolved.foundByUserId,
    athleteFoundByEmail: resolved.foundByEmail,
    paymentStatus: emailAccess?.debug.paymentPaid ?? null,
    userIdsMatch: emailAccess?.debug.userIdsMatch ?? null,
    accessReason: emailAccess?.debug.accessReason ?? null,
    athleteUserId: emailAccess?.debug.athleteUserId ?? null,
    resolveSource: resolved.source,
  });
}

/**
 * Athlete API guard — resolves paid linked hyrox_athletes via user_id, then email fallback.
 */
export async function requireCurrentHyroxAthleteForApi() {
  const supabase = await createClient();
  const resolved = await resolveCurrentHyroxAthlete(supabase);
  const { user, athlete } = resolved;

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const emailAccess = user.email?.trim()
    ? await evaluateAthleteEmailAccess(user.id, user.email)
    : null;

  if (
    emailAccess?.debug.accessReason === "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER"
  ) {
    logApiResolutionFailure(user, resolved, emailAccess);
    return {
      error: NextResponse.json(
        {
          error:
            "Your email matches a paid athlete profile linked to a different sign-in account. Ask your coach to relink your account.",
          code: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
        },
        { status: 403 }
      ),
    };
  }

  if (!athlete) {
    logApiResolutionFailure(user, resolved, emailAccess);
    return {
      error: NextResponse.json(
        {
          error:
            "No paid Hyrox athlete profile found for this sign-in. Use /athlete/login with the same email you applied with, or ask your coach to link your account.",
          code: emailAccess?.debug.accessReason ?? "NO_LINKED_ATHLETE",
        },
        { status: 403 }
      ),
    };
  }

  if (athlete.payment_status !== "paid") {
    return {
      error: NextResponse.json(
        {
          error:
            "Your payment is not confirmed yet. Once confirmed, your assessment will unlock.",
          code: "payment_pending",
        },
        { status: 403 }
      ),
    };
  }

  if (athlete.user_id && athlete.user_id !== user.id) {
    logApiResolutionFailure(user, resolved, emailAccess);
    return {
      error: NextResponse.json(
        {
          error:
            "Athlete profile is linked to a different account. Ask your coach to relink your account.",
          code: "ATHLETE_EMAIL_LINKED_TO_DIFFERENT_AUTH_USER",
        },
        { status: 403 }
      ),
    };
  }

  const linkedPaid =
    (athlete.user_id === user.id && athlete.payment_status === "paid") ||
    isAthletePortalLinked(emailAccess);

  if (!linkedPaid) {
    logApiResolutionFailure(user, resolved, emailAccess);
    return {
      error: NextResponse.json(
        {
          error:
            "No paid Hyrox athlete profile found for this sign-in. Use /athlete/login with the same email you applied with, or ask your coach to link your account.",
          code: emailAccess?.debug.accessReason ?? "NO_LINKED_ATHLETE",
        },
        { status: 403 }
      ),
    };
  }

  logHyroxAuthDebug("hyrox-api-athlete-resolved", {
    authUserId: user.id,
    athleteId: athlete.id,
    source: resolved.source,
    accessReason: emailAccess?.debug.accessReason ?? null,
  });

  return { supabase, user, athlete: athlete as HyroxAthleteRow };
}

/** @deprecated Use requireCurrentHyroxAthleteForApi */
export const requireLinkedHyroxAthleteApi = requireCurrentHyroxAthleteForApi;
