"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgressDashboardSection } from "@/components/athlete-command-centre/ProgressDashboardSection";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  athleteCard,
  athleteCardPadding,
} from "@/components/athlete-command-centre/athleteUi";
import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { AthleteAnalyticsSection } from "./AthleteAnalyticsSection";

/**
 * Progress = longitudinal change. Performance Hub stays on /athlete/benchmarks.
 * When analytics flag is off, keep the sparse Progress fallback — never substitute Hub.
 */
export default function ProgressPageClient({
  analyticsEnabled = false,
  analytics = null,
  analyticsError = null,
}: {
  analyticsEnabled?: boolean;
  analytics?: HyroxAthleteAnalytics | null;
  analyticsError?: string | null;
}) {
  const meta = ATHLETE_PAGE_META.progress;

  return (
    <ActiveAthletePage gate="none">
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        {analyticsEnabled ? (
          analyticsError ? (
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
          )
        ) : (
          <ProgressDashboardSection />
        )}
      </PageContent>
    </ActiveAthletePage>
  );
}
