"use client";

import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import {
  ProgrammePageResolveNotice,
  ProgrammePageServerDebugPanel,
} from "@/components/athlete-command-centre/ProgrammePageServerDebug";
import { ProgrammePageView } from "@/components/athlete-command-centre/ProgrammePageView";
import {
  AthletePortalSeedProvider,
  useAthletePortal,
  type PortalAthleteSummary,
} from "@/components/athlete-command-centre/athletePortalContext";
import { resolveProgrammePageRenderGate } from "@/app/lib/hyroxAthleteProgrammePageGate";
import type { ProgrammePageServerDebug } from "@/app/lib/hyroxAthleteProgrammePageServer";
import type { AthleteLiveProgrammePayload } from "@/components/athlete-command-centre/useAthleteLiveProgramme";

type Variant = "ready" | "no-session" | "not-linked";

function ProgrammePageInner({
  variant,
  serverDebug,
  initialProgramme,
  serverProgrammePublished,
  serverPortalAthlete,
}: {
  variant: Variant;
  serverDebug: ProgrammePageServerDebug;
  initialProgramme: AthleteLiveProgrammePayload | null;
  serverProgrammePublished: boolean;
  serverPortalAthlete: PortalAthleteSummary | null;
}) {
  const { serverAuthConfirmed, portalAthlete } = useAthletePortal();

  const gate = resolveProgrammePageRenderGate({
    variant,
    debug: serverDebug,
    initialProgramme,
    serverProgrammePublished,
    layoutServerAuthConfirmed: serverAuthConfirmed,
    portalAthleteId: portalAthlete?.id ?? null,
  });

  if (gate.showAuthNotice) {
    return (
      <div className="min-h-[50vh] px-4 py-10 sm:px-6">
        <ProgrammePageResolveNotice
          variant={gate.decision === "not-linked" ? "not-linked" : "no-session"}
          debug={serverDebug}
          gate={gate}
        />
      </div>
    );
  }

  return (
    <AthletePortalSeedProvider
      serverProgrammePublished={serverProgrammePublished}
      serverProgramme={initialProgramme}
      serverPortalAthlete={serverPortalAthlete}
    >
      <ActiveAthletePage allowLinkedProgrammeAccess>
        <ProgrammePageServerDebugPanel
          debug={serverDebug}
          variant={variant}
          layoutServerAuthConfirmed={serverAuthConfirmed}
          gate={gate}
        />
        {gate.decision === "published-empty" ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-sm text-amber-100/90">
            Programme is marked published but no sessions were found. Ask your coach to publish
            week sessions, or reload after a few minutes.
          </p>
        ) : null}
        <ProgrammePageView
          serverProgramme={initialProgramme}
          serverLoadVariant={variant}
          serverRenderDecision={gate.decision}
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
  serverPortalAthlete?: PortalAthleteSummary | null;
}) {
  return (
    <ProgrammePageInner
      variant={props.variant}
      serverDebug={props.serverDebug}
      initialProgramme={props.initialProgramme ?? null}
      serverProgrammePublished={props.serverProgrammePublished ?? false}
      serverPortalAthlete={props.serverPortalAthlete ?? null}
    />
  );
}
