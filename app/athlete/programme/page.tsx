import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildAthleteLoginNextFromRequest } from "@/app/lib/authRedirectUrl";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import { resolveLinkedHyroxAthleteForServer } from "@/app/lib/hyroxAthletePortalServerAuth";
import ProgrammePageClient from "./ProgrammePageClient";

export const metadata: Metadata = {
  title: "Programme | Hyrox Team Athlete",
  description: "Your weekly Hybrid365 Hyrox training programme.",
};

export default async function AthleteProgrammePage() {
  const linked = await resolveLinkedHyroxAthleteForServer();

  if (!linked) {
    const next = buildAthleteLoginNextFromRequest("/athlete/programme", "");
    redirect(`/athlete/login?next=${encodeURIComponent(next)}`);
  }

  const initialProgramme = await fetchAthleteLiveProgrammeForServer(
    linked.athlete,
    linked.user.email
  );

  return <ProgrammePageClient initialProgramme={initialProgramme} />;
}
