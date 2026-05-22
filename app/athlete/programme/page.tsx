import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildAthleteLoginNextFromRequest } from "@/app/lib/authRedirectUrl";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import {
  getAthleteLayoutSessionUser,
  resolveLinkedHyroxAthleteForServer,
} from "@/app/lib/hyroxAthletePortalServerAuth";
import { AthletePortalSeedProvider } from "@/components/athlete-command-centre/athletePortalContext";
import ProgrammePageClient from "./ProgrammePageClient";

export const metadata: Metadata = {
  title: "Programme | Hyrox Team Athlete",
  description: "Your weekly Hybrid365 Hyrox training programme.",
};

export default async function AthleteProgrammePage() {
  const user = await getAthleteLayoutSessionUser();
  if (!user) {
    const next = buildAthleteLoginNextFromRequest("/athlete/programme", "");
    redirect(`/athlete/login?next=${encodeURIComponent(next)}`);
  }

  const linked = await resolveLinkedHyroxAthleteForServer();
  const initialProgramme = linked
    ? await fetchAthleteLiveProgrammeForServer(linked.athlete, linked.user.email)
    : null;

  const serverProgrammePublished =
    Boolean(initialProgramme?.published) || initialProgramme?.state === "published";

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={initialProgramme}
    >
      <ProgrammePageClient initialProgramme={initialProgramme} />
    </AthletePortalSeedProvider>
  );
}
