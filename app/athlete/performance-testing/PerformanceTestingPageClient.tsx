"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { PerformanceTestingPageView } from "@/components/athlete-command-centre/PerformanceTestingPageView";
import { PageContent } from "@/components/athlete-command-centre/athleteUi";

export default function PerformanceTestingPageClient() {
  return (
    <ActiveAthletePage allowLinkedProgrammeAccess>
      <PageContent width="wide">
        <PerformanceTestingPageView />
      </PageContent>
    </ActiveAthletePage>
  );
}
