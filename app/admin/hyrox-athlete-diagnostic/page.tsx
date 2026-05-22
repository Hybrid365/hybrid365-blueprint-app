import { buildHyroxAthleteDiagnosticReport } from "@/app/lib/hyroxAthleteDiagnostic";
import { getHyroxAccessContext } from "@/app/lib/hyroxAccess";
import { HyroxAthleteDiagnosticView } from "@/components/admin-hyrox-athletes/HyroxAthleteDiagnosticView";

export const metadata = {
  title: "Hyrox Athlete Diagnostic | Hybrid365 Coach",
  description: "Internal diagnostic for Hyrox athlete portal auth and programme data.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ email?: string; athleteId?: string }>;
};

export default async function HyroxAthleteDiagnosticPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const ctx = await getHyroxAccessContext();
  const defaultEmail = ctx?.email ?? null;

  const hasSearch = Boolean(params.email?.trim() || params.athleteId?.trim());

  const report = hasSearch
    ? await buildHyroxAthleteDiagnosticReport({
        searchEmail: params.email ?? defaultEmail,
        searchAthleteId: params.athleteId ?? null,
      })
    : null;

  return (
    <HyroxAthleteDiagnosticView report={report} defaultEmail={defaultEmail} />
  );
}
