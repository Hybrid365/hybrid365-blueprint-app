import { probeHyroxPortalAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { User } from "@supabase/supabase-js";

/** Supabase user for athlete server pages — merged cookies + session retry + middleware identity. */
export async function getAthleteLayoutSessionUser(): Promise<User | null> {
  const { user } = await probeHyroxPortalAuth();
  return user;
}

/** Linked paid athlete for server pages — same rules as layout + athlete APIs. */
export async function resolveLinkedHyroxAthleteForServer(): Promise<{
  user: User;
  athlete: HyroxAthleteRow;
} | null> {
  const { user, supabase } = await probeHyroxPortalAuth();
  if (!user) return null;

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
