import { redirect } from "next/navigation";
import {
  assertMembershipAllowsDashboard,
  fetchMembershipForAccess,
} from "@/app/lib/membershipGate";
import { claimPendingWhopMembershipForUser } from "@/app/lib/whopMembershipSync";
import { createServiceRoleClient } from "@/app/lib/supabaseAdmin";
import { createClient } from "@/app/lib/supabase/server";

export default async function DashboardMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  if (user.email) {
    try {
      const admin = createServiceRoleClient();
      await claimPendingWhopMembershipForUser(admin, user.id, user.email);
    } catch (e) {
      console.warn("[dashboard] pending Whop claim skipped", e);
    }
  }

  const membership = await fetchMembershipForAccess(supabase, user.id);
  const gate = assertMembershipAllowsDashboard({ membership, userId: user.id });
  if (!gate.allowed) {
    redirect("/dashboard/no-access");
  }

  return <>{children}</>;
}
