import { redirect } from "next/navigation";
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

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const isActive = membership?.status === "active";
  const expiresAt = membership?.expires_at
    ? new Date(membership.expires_at)
    : null;
  const notExpired =
    expiresAt === null || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();

  if (!isActive || !notExpired) {
    redirect("/dashboard/no-access");
  }

  return <>{children}</>;
}
