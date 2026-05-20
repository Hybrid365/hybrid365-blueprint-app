"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ResourcesPageView } from "@/components/athlete-command-centre/ResourcesPageView";

export default function ResourcesPageClient() {
  return (
    <ActiveAthletePage>
      <ResourcesPageView />
    </ActiveAthletePage>
  );
}
