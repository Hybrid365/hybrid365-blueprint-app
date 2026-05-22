import type { Metadata } from "next";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import { fetchAthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingServer";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import { resolveLinkedHyroxAthleteForServer } from "@/app/lib/hyroxAthletePortalServerAuth";
import { AthletePortalSeedProvider } from "@/components/athlete-command-centre/athletePortalContext";
import DashboardPageClient from "./DashboardPageClient";

export const metadata: Metadata = {
  title: "Dashboard | Hyrox Team Athlete",
  description: "Your Hybrid365 Hyrox Team athlete dashboard.",
};

export default async function AthleteDashboardPage() {
  let initialProgress: AthleteOnboardingProgress | null = null;
  let initialProgramme = null;

  const linked = await resolveLinkedHyroxAthleteForServer();
  if (linked) {
    const [progress, programme] = await Promise.all([
      fetchAthleteOnboardingProgress(linked.athlete),
      fetchAthleteLiveProgrammeForServer(linked.athlete, linked.user.email),
    ]);
    initialProgress = progress;
    initialProgramme = programme;
  }

  const serverProgrammePublished =
    Boolean(initialProgress?.programmePublished) ||
    Boolean(initialProgramme?.published) ||
    (initialProgramme?.programmeWeeks?.filter((w) => w.generated).length ?? 0) > 0;

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={initialProgramme}
    >
      <DashboardPageClient initialProgress={initialProgress} />
    </AthletePortalSeedProvider>
  );
}
