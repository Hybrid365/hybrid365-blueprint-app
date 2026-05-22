"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import {
  ProgrammePageResolveNotice,
  ProgrammePageServerDebugPanel,
} from "@/components/athlete-command-centre/ProgrammePageServerDebug";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import { AthletePortalSeedProvider } from "@/components/athlete-command-centre/athletePortalContext";
import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

type Variant = "ready" | "no-session" | "not-linked";

export default function ProgrammePageClient({
  variant,
  serverDebug,
  initialProgramme = null,
  serverProgrammePublished = false,
}: {
  variant: Variant;
  serverDebug: ProgrammePageServerDebug;
  initialProgramme?: AthleteLiveProgrammePayload | null;
  serverProgrammePublished?: boolean;
}) {
  if (variant !== "ready") {
    return (
      <div className="min-h-[50vh] px-4 py-10 sm:px-6">
        <ProgrammePageResolveNotice variant={variant} debug={serverDebug} />
      </div>
    );
  }

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={initialProgramme}
    >
      <ActiveAthletePage allowLinkedProgrammeAccess>
        <ProgrammePageServerDebugPanel debug={serverDebug} variant={variant} />
        <ProgrammePageView serverProgramme={initialProgramme} />
      </ActiveAthletePage>
    </AthletePortalSeedProvider>
  );
}
