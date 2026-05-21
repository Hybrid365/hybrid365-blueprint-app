import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";

export default async function HyroxAthletesAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertHyroxCoachAccess();
  return <>{children}</>;
}
