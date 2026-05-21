import { requireDashboardMemberAccess } from "@/app/lib/dashboardAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardMemberAccess("/dashboard");
  return <DashboardShell>{children}</DashboardShell>;
}
