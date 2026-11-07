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
  /** Performance page always uses Performance meta — never confuse with Performance Testing. */
  const meta = ATHLETE_PAGE_META.benchmarks;
  return (
    <ActiveAthletePage allowLinkedProgrammeAccess>
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        {!enabled ? (
          <p className="mb-4 text-xs text-zinc-500">
            Programming-anchor profile is not enabled for this account yet — showing the sparse
            testing snapshot fallback.
          </p>
        ) : null}
        <AthleteBenchmarksBody />
      </PageContent>
    </ActiveAthletePage>
  );
}
