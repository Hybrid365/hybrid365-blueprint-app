"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { BenchmarksDashboardSection } from "@/components/athlete-command-centre/BenchmarksDashboardSection";
import { ATHLETE_PAGE_META, PageContent, PageHeader } from "@/components/athlete-command-centre/athleteUi";

export default function BenchmarksPageClient() {
  const meta = ATHLETE_PAGE_META.benchmarks;
  return (
    <ActiveAthletePage>
      <PageContent>
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
        <BenchmarksDashboardSection />
      </PageContent>
    </ActiveAthletePage>
  );
}
