import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertMembershipAllowsDashboard,
  fetchMembershipForAccess,
} from "@/app/lib/membershipGate";
import { claimPendingWhopMembershipForUser } from "@/app/lib/whopMembershipSync";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { createClient } from "@/app/lib/supabase/server";

function logAuth(
  event: string,
  route: string,
  extra?: Record<string, string | boolean | null | undefined>
) {
  console.log("[dashboard auth]", event, { route, ...extra });
}

/** Server-side session for community dashboard routes. */
export async function getDashboardSession(route: string): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    logAuth("getUser error", route, { message: error.message });
  }

  if (!user) {
    console.log("[dashboard auth] redirect login", { route, hasUser: false });
    redirect(`/login?next=${encodeURIComponent(route)}`);
  }

  console.log("[dashboard auth] hasUser", { route, hasUser: true, userId: user.id.slice(0, 8) });
  return { supabase, user };
}

/**
 * Auth + active Whop membership gate for `(main)` dashboard layout.
 * Signed-out → /login; signed-in without membership → /dashboard/no-access.
 */
export async function requireDashboardMemberAccess(route: string): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  logAuth("route", route);
  const { supabase, user } = await getDashboardSession(route);

  if (user.email) {
    try {
      const admin = createServiceRoleClient();
      await claimPendingWhopMembershipForUser(admin, user.id, user.email);
    } catch (e) {
      console.warn("[dashboard auth] pending Whop claim skipped", {
        route,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const membership = await fetchMembershipForAccess(supabase, user.id);
  const gate = assertMembershipAllowsDashboard({ membership, userId: user.id });

  if (!gate.allowed) {
    logAuth("no access", route, { hasUser: true, activeMembership: false });
    redirect("/dashboard/no-access");
  }

  logAuth("active membership", route, { hasUser: true, activeMembership: true });
  return { supabase, user };
}
