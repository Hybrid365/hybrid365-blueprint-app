import { cookies } from "next/headers";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  authCookiesPresent,
  resolveAuthUserForMiddleware,
} from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type HyroxMutationAuthDebug = {
  hasAuthCookie: boolean;
  refreshAttempted: boolean;
  getUserSucceeded: boolean;
  accessReason: string | null;
  matchSource: string | null;
  athleteId: string | null;
  expectedAthleteId: string | null;
};

export type HyroxMutationAuthResult =
  | {
      ok: true;
      user: User;
      athlete: HyroxAthleteRow;
      supabase: SupabaseClient;
      via: "linked" | "portal-context";
      debug: HyroxMutationAuthDebug;
    }
  | {
      ok: false;
      code: "NO_USER" | "NO_ATHLETE" | "NOT_PAID";
      error: string;
      debug: HyroxMutationAuthDebug;
    };

function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = a?.trim().toLowerCase();
  const right = b?.trim().toLowerCase();
  return Boolean(left && right && left === right);
}

/**
 * Auth for Hyrox mutations (server actions) — same rules as layout, with optional
 * portal athlete id fallback when layout already confirmed the athlete.
 */
export async function resolveAthleteForHyroxMutation(
  expectedAthleteId?: string | null
): Promise<HyroxMutationAuthResult> {
  const cookieStore = await cookies();
  const hasAuthCookie = authCookiesPresent(cookieStore.getAll());
  const supabase = await createClient();
  const { user, retriedWithSession } = await resolveAuthUserForMiddleware(
    supabase,
    hasAuthCookie
  );

  const debug: HyroxMutationAuthDebug = {
    hasAuthCookie,
    refreshAttempted: retriedWithSession,
    getUserSucceeded: Boolean(user),
    accessReason: null,
    matchSource: null,
    athleteId: null,
    expectedAthleteId: expectedAthleteId ?? null,
  };

  if (!user) {
    return {
      ok: false,
      code: "NO_USER",
      error: hasAuthCookie
        ? "Auth cookies are present but Supabase user could not be resolved."
        : "No Supabase auth session on this request.",
      debug,
    };
  }

  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  const athlete = portal.athlete;
  debug.accessReason = portal.accessReason ?? null;
  debug.matchSource = portal.matchSource;
  debug.athleteId = athlete?.id ?? null;

  const strictlyLinked =
    portal.accessReason === "LINKED" &&
    athlete?.payment_status === "paid" &&
    athlete.user_id === user.id;

  if (strictlyLinked && athlete) {
    return { ok: true, user, athlete, supabase, via: "linked", debug };
  }

  if (
    expectedAthleteId &&
    athlete?.id === expectedAthleteId &&
    athlete.payment_status === "paid" &&
    (athlete.user_id === user.id || emailsMatch(athlete.email, user.email))
  ) {
    return { ok: true, user, athlete, supabase, via: "portal-context", debug };
  }

  if (athlete && athlete.payment_status !== "paid") {
    return {
      ok: false,
      code: "NOT_PAID",
      error: "Athlete profile is not marked as paid.",
      debug,
    };
  }

  return {
    ok: false,
    code: "NO_ATHLETE",
    error:
      portal.accessReason === "UNLINKED_PAID"
        ? "Paid athlete profile found but not linked to this sign-in."
        : "No linked Hyrox athlete profile for this login.",
    debug,
  };
}
