import { notFound, redirect } from "next/navigation";
import CoachAthleteViewAsClient from "@/components/admin-hyrox-athletes/CoachAthleteViewAsClient";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";

export const dynamic = "force-dynamic";

type ViewAsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HyroxAthleteViewAsPage({ params }: ViewAsPageProps) {
  const { id } = await params;
  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, id);

  if (error) {
    throw new Error(error);
  }

  if (!athlete) {
    notFound();
  }

  const programme = await fetchAthleteLiveProgrammeForServer(athlete);

  if (!programme?.published) {
    redirect("/admin/hyrox-athletes/published-views");
  }

  return <CoachAthleteViewAsClient athlete={athlete} programme={programme} />;
}
