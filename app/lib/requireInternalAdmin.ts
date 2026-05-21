import { createClient } from "@/app/lib/supabase/server";
import { isInternalAdminEmail, parseInternalAdminEmails } from "@/app/lib/internalAdminAccess";
import type { User } from "@supabase/supabase-js";

/** Programme refresh tool requires INTERNAL_ADMIN_EMAILS to be configured. */
export function isInternalAdminRouteConfigured(): boolean {
  return parseInternalAdminEmails().length > 0;
}

/**
 * Signed-in user allowed on strict internal admin tools (e.g. programme refresh).
 * Returns null when unauthenticated, list unset, or email not on the list.
 */
export async function getStrictInternalAdminUser(): Promise<User | null> {
  if (!isInternalAdminRouteConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isInternalAdminEmail(user.email)) return null;
  return user;
}
