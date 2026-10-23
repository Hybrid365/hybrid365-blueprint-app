"use client";

"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { AthleteBenchmarksBody } from "@/components/athlete-command-centre/AthleteBenchmarksBody";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { ATHLETE_PAGE_META, PageContent, PageHeader } from "@/components/athlete-command-centre/athleteUi";

export default function BenchmarksPageClient() {
  const meta = ATHLETE_PAGE_META.benchmarks;
  const portal = useAthletePortalOptional();
  const preview = useAthleteAdminPreview();
  const enabled = Boolean(preview?.performanceProfileEnabled || portal?.performanceProfileEnabled);
  return (
    <ActiveAthletePage>
      <PageContent>
        <PageHeader
          eyebrow={enabled ? "Performance" : meta.eyebrow}
          title={meta.title}
          subtitle={
            enabled
              ? "Current benchmarks, history, and results waiting for coach review."
              : meta.subtitle
          }
        />
        <AthleteBenchmarksBody />
      </PageContent>
    </ActiveAthletePage>
  );
}
