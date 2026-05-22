import { resolveHyroxPortalAthlete } from "@/app/lib/hyroxAthletePortalResolve";
import type { HyroxAthleteRow } from "@/app/lib/hyroxDatabaseTypes";
import { createClient } from "@/app/lib/supabase/server";

/** Linked paid athlete for server pages — same rules as layout + athlete APIs. */
export async function resolveLinkedHyroxAthleteForServer(): Promise<{
  user: { id: string; email?: string | null };
  athlete: HyroxAthleteRow;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
