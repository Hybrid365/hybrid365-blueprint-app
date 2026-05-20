"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgressDashboardSection } from "@/components/athlete-command-centre/ProgressDashboardSection";
import { ATHLETE_PAGE_META, PageContent, PageHeader } from "@/components/athlete-command-centre/athleteUi";

export default function ProgressPageClient() {
  const meta = ATHLETE_PAGE_META.progress;
  return (
    <ActiveAthletePage>
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        <ProgressDashboardSection />
      </PageContent>
    </ActiveAthletePage>
  );
}
