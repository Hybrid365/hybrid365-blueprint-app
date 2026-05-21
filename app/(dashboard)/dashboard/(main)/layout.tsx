import { requireDashboardMemberAccess } from "@/app/lib/dashboardAuth";

export default async function DashboardMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireDashboardMemberAccess("/dashboard");
  return <>{children}</>;
}
