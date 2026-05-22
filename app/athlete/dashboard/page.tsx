import type { Metadata } from "next";
import type { AthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingFlow";
import { fetchAthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingServer";
import { resolveLinkedHyroxAthleteForServer } from "@/app/lib/hyroxAthletePortalServerAuth";
import { AthletePortalSeedProvider } from "@/components/athlete-command-centre/athletePortalContext";
import DashboardPageClient from "./DashboardPageClient";

export const metadata: Metadata = {
  title: "Dashboard | Hyrox Team Athlete",
  description: "Your Hybrid365 Hyrox Team athlete dashboard.",
};

export default async function AthleteDashboardPage() {
  let initialProgress: AthleteOnboardingProgress | null = null;

  const linked = await resolveLinkedHyroxAthleteForServer();
  if (linked) {
    initialProgress = await fetchAthleteOnboardingProgress(linked.athlete);
  }

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={Boolean(initialProgress?.programmePublished)}
    >
      <DashboardPageClient initialProgress={initialProgress} />
    </AthletePortalSeedProvider>
  );
}
