import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";

export default async function CommunityProgrammePreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertHyroxCoachAccess();
  return <>{children}</>;
}
