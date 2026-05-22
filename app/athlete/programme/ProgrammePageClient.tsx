"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import {
  ProgrammePageResolveNotice,
  ProgrammePageServerDebugPanel,
} from "@/components/athlete-command-centre/ProgrammePageServerDebug";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import { AthletePortalSeedProvider, useAthletePortal } from "@/components/athlete-command-centre/athletePortalContext";
import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

type Variant = "ready" | "no-session" | "not-linked";

function ProgrammePageInner({
  variant,
  serverDebug,
  initialProgramme,
  serverProgrammePublished,
}: {
  variant: Variant;
  serverDebug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
  serverProgrammePublished: boolean;
}) {
  const { serverAuthConfirmed, portalAthlete } = useAthletePortal();
  const layoutTrustsAthlete = serverAuthConfirmed && Boolean(portalAthlete?.id);
  const serverVariantFailed = variant !== "ready";

  if (serverVariantFailed && !layoutTrustsAthlete) {
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
        <ProgrammePageServerDebugPanel
          debug={serverDebug}
          variant={variant}
          layoutTrustsAthlete={layoutTrustsAthlete}
          serverVariantFailed={serverVariantFailed}
        />
        <ProgrammePageView
          serverProgramme={initialProgramme}
          serverLoadVariant={variant}
        />
      </ActiveAthletePage>
    </AthletePortalSeedProvider>
  );
}

export default function ProgrammePageClient(props: {
  variant: Variant;
  serverDebug: ProgrammePageServerDebug;
  initialProgramme?: AthleteLiveProgrammePayload | null;
  serverProgrammePublished?: boolean;
}) {
  return (
    <ProgrammePageInner
      variant={props.variant}
      serverDebug={props.serverDebug}
      initialProgramme={props.initialProgramme ?? null}
      serverProgrammePublished={props.serverProgrammePublished ?? false}
    />
  );
}
