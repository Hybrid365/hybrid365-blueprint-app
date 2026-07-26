"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgressDashboardSection } from "@/components/athlete-command-centre/ProgressDashboardSection";
import { PerformanceHubExperience } from "@/components/athlete-command-centre/performance-hub/PerformanceHubExperience";
import { ATHLETE_PAGE_META, PageContent, PageHeader } from "@/components/athlete-command-centre/athleteUi";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { isHyroxPerformanceHubEnabledClient } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";

export default function ProgressPageClient() {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const hubEnabled = isHyroxPerformanceHubEnabledClient(
    adminPreview?.performanceHubEnabled ?? portal?.performanceHubEnabled
  );
  const meta = ATHLETE_PAGE_META.progress;

  return (
    <ActiveAthletePage>
      <PageContent width="wide">
        {hubEnabled ? (
          <PerformanceHubExperience />
        ) : (
          <>
            <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
            <ProgressDashboardSection />
          </>
        )}
      </PageContent>
    </ActiveAthletePage>
  );
}
