"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgressDashboardSection } from "@/components/athlete-command-centre/ProgressDashboardSection";
import { PerformanceHubExperience } from "@/components/athlete-command-centre/performance-hub/PerformanceHubExperience";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  athleteCard,
  athleteCardPadding,
} from "@/components/athlete-command-centre/athleteUi";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { isHyroxPerformanceHubEnabledClient } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { AthleteAnalyticsSection } from "./AthleteAnalyticsSection";

export default function ProgressPageClient({
  analyticsEnabled = false,
  analytics = null,
  analyticsError = null,
}: {
  analyticsEnabled?: boolean;
  analytics?: HyroxAthleteAnalytics | null;
  analyticsError?: string | null;
}) {
  const portal = useAthletePortalOptional();
  const adminPreview = useAthleteAdminPreview();
  const hubEnabled = isHyroxPerformanceHubEnabledClient(
    adminPreview?.performanceHubEnabled ?? portal?.performanceHubEnabled
  );
  const meta = ATHLETE_PAGE_META.progress;

  return (
    <ActiveAthletePage>
      <PageContent width="wide">
        {analyticsEnabled ? (
          <>
            <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
            {analyticsError ? (
              <div className={`${athleteCard} ${athleteCardPadding}`}>
                <p className="text-sm leading-relaxed text-zinc-300">{analyticsError}</p>
                <p className="mt-2 text-xs text-zinc-500">Refresh the page to try again.</p>
              </div>
            ) : analytics ? (
              <AthleteAnalyticsSection analytics={analytics} />
            ) : (
              <div className={`${athleteCard} ${athleteCardPadding}`}>
                <p className="text-sm leading-relaxed text-zinc-300">
                  Training analytics are on, but there is nothing stored to show yet.
                </p>
              </div>
            )}
          </>
        ) : hubEnabled ? (
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
