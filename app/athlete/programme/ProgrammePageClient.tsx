"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

export default function ProgrammePageClient({
  initialProgramme = null,
}: {
  initialProgramme?: AthleteLiveProgrammePayload | null;
}) {
  return (
    <ActiveAthletePage allowLinkedProgrammeAccess>
      <ProgrammePageView serverProgramme={initialProgramme} />
    </ActiveAthletePage>
  );
}
