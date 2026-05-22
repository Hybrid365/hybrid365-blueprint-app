import { cookies, headers } from "next/headers";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  middlewareForwardedAthleteAuth,
  probeAthleteAuthMarkers,
} from "@/app/lib/supabase/athleteAuthGate";
import { resolveAuthUserForMiddleware } from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Supabase user for athlete server pages — same cookie/header probes as layout + middleware. */
export async function getAthleteLayoutSessionUser(): Promise<User | null> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const authMarkers = probeAthleteAuthMarkers(cookieStore, headerStore);
  const hasAuthCookie =
    authMarkers.present || middlewareForwardedAthleteAuth(headerStore);
  const supabase = await createClient();
  const { user } = await resolveAuthUserForMiddleware(supabase, hasAuthCookie);
  return user;
}

/** Linked paid athlete for server pages — same rules as layout + athlete APIs. */
export async function resolveLinkedHyroxAthleteForServer(): Promise<{
  user: User;
  athlete: HyroxAthleteRow;
} | null> {
  const user = await getAthleteLayoutSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const portal = await resolveHyroxPortalAthlete({
    user,
    supabase,
    attemptAutoLink: true,
  });

  const linked =
    portal.accessReason === "LINKED" &&
    portal.athlete?.payment_status === "paid" &&
    portal.athlete.user_id === user.id;

  if (!linked || !portal.athlete) return null;

  return { user, athlete: portal.athlete };
}
