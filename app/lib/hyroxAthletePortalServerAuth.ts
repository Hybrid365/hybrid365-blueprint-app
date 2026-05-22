import { cookies } from "next/headers";
import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { authCookiesPresent } from "@/app/lib/supabase/resolveAuthUser";
import { createClient } from "@/app/lib/supabase/server";
import { resolveAuthUserWithSessionRetry } from "@/app/lib/supabase/resolveAuthUser";
import type { User } from "@supabase/supabase-js";

/** Supabase user for athlete server pages — same session refresh as layout. */
export async function getAthleteLayoutSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const hasAuthCookie = authCookiesPresent(cookieStore.getAll());
  const supabase = await createClient();
  const { user } = await resolveAuthUserWithSessionRetry(supabase, {
    hasAuthCookie,
  });
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
