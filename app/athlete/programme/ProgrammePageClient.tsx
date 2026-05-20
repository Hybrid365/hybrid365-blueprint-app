"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";

export default function ProgrammePageClient() {
  return (
    <ActiveAthletePage>
      <ProgrammePageView />
    </ActiveAthletePage>
  );
}
