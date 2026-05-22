import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import type { User } from "@supabase/supabase-js";

/** Supabase user for athlete server pages — sb cookies or h365_athlete_session. */
export async function getAthleteLayoutSessionUser(routePath?: string): Promise<User | null> {
  const portal = await resolveAthletePortalPageAuth(routePath ?? "/athlete");
  return portal.user;
}

/** Linked paid athlete for server pages — same resolver as layout. */
export async function resolveLinkedHyroxAthleteForServer(
  routePath?: string
): Promise<{
  user: User;
  athlete: HyroxAthleteRow;
} | null> {
  const portal = await resolveAthletePortalPageAuth(routePath ?? "/athlete");
  if (!portal.user || !portal.athlete || !portal.serverAuthConfirmed) return null;
  return { user: portal.user, athlete: portal.athlete };
}
