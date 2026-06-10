import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";

export default async function OneToOneApplicationsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertHyroxCoachAccess();
  return <>{children}</>;
}
