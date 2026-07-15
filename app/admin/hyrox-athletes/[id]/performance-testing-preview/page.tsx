import { notFound } from "next/navigation";
import { PerformanceTestingPreviewClient } from "@/components/admin-hyrox-athletes/PerformanceTestingPreviewClient";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Performance Testing Preview | Hybrid365 Coach",
};

type PreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PerformanceTestingPreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, id);

  if (error) {
    throw new Error(error);
  }

  if (!athlete) {
    notFound();
  }

  return (
    <PerformanceTestingPreviewClient
      athleteId={athlete.id}
      athleteName={athlete.name}
      athleteStatus={athlete.status}
    />
  );
}
