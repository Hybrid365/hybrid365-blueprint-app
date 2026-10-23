"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { AthleteBenchmarksBody } from "@/components/athlete-command-centre/AthleteBenchmarksBody";
import { useAthleteAdminPreview } from "@/components/athlete-command-centre/athletePortalAdminPreview";
import { useAthletePortalOptional } from "@/components/athlete-command-centre/athletePortalContext";
import { ATHLETE_PAGE_META, PageContent, PageHeader } from "@/components/athlete-command-centre/athleteUi";

export default function BenchmarksPageClient() {
  const portal = useAthletePortalOptional();
  const preview = useAthleteAdminPreview();
  const enabled = Boolean(preview?.performanceProfileEnabled || portal?.performanceProfileEnabled);
  const meta = enabled ? ATHLETE_PAGE_META.benchmarks : ATHLETE_PAGE_META.performanceTesting;
  return (
    <ActiveAthletePage>
      <PageContent>
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        <AthleteBenchmarksBody />
      </PageContent>
    </ActiveAthletePage>
  );
}
