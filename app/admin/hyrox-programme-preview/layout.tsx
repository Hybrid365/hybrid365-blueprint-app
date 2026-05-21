import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";

export default async function HyroxProgrammePreviewAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertHyroxCoachAccess();
  return <>{children}</>;
}
