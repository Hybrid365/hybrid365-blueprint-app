import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";

export default async function HyroxAthleteDiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertHyroxCoachAccess();
  return <>{children}</>;
}
