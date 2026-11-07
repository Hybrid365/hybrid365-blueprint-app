"use client";

import { usePathname } from "next/navigation";
import { PreviewGateCard, ProgrammeWaitingCard } from "./athleteUi";
import { useAthletePortal } from "./athletePortalContext";

function resolveGateBlockReason(input: {
  programmePublishedLive: boolean;
  programmeHubLive: boolean;
  serverAuthConfirmed: boolean;
  serverProgrammePublishedSeed: boolean;
  hasLinkedAthlete: boolean;
  allowLinkedProgrammeAccess: boolean;
  clientLiveProgrammePublished: boolean;
}): string {
  if (input.programmePublishedLive || input.programmeHubLive) {
    return "allowed: programme live";
  }
  if (input.serverAuthConfirmed && input.serverProgrammePublishedSeed) {
    return "allowed: server programme seed";
  }
  if (input.allowLinkedProgrammeAccess && input.hasLinkedAthlete) {
    return "allowed: linked athlete access";
  }
  if (!input.hasLinkedAthlete) return "blocked: not linked";
  if (!input.serverAuthConfirmed) return "blocked: server auth not confirmed";
  if (!input.serverProgrammePublishedSeed) {
    return (
      "blocked: serverProgrammePublishedSeed false (client published=" +
      (input.clientLiveProgrammePublished ? "yes" : "no") +
      ")"
    );
  }
  return "blocked: programme hub not live";
}

/**
 * Unlocks athlete tab content when server confirms a published programme,
 * or when the page opts into linked-athlete access (Progress / Performance /
 * Programme / testing) so sparse real UI can render before seed catches up.
 */
export function AthletePortalGate({
  children,
  allowLinkedProgrammeAccess = false,
}: {
  children: React.ReactNode;
  /** Linked paid athletes may enter without waiting on published-seed race. */
  allowLinkedProgrammeAccess?: boolean;
}) {
  const pathname = usePathname();
  const {
    programmeHubLive,
    programmePublishedLive,
    hasLinkedAthlete,
    allowMockPreview,
    serverProgrammePublishedSeed,
    serverAuthConfirmed,
    liveProgramme,
    portalAuthSource,
    routeAuthDebug,
  } = useAthletePortal();

  const clientLiveProgrammePublished = Boolean(liveProgramme?.published);

  /**
   * allowLinkedProgrammeAccess pages (Programme / Progress / Performance / testing)
   * unlock for any linked paid athlete. Sparse empty UI is preferred over a hard
   * "programme not live" wall when seed/API lag or Preview auth is flaky.
   */
  const allowed =
    programmePublishedLive ||
    programmeHubLive ||
    (serverAuthConfirmed && serverProgrammePublishedSeed) ||
    (allowLinkedProgrammeAccess && hasLinkedAthlete);

  const reasonBlocked = resolveGateBlockReason({
    programmePublishedLive,
    programmeHubLive,
    serverAuthConfirmed,
    serverProgrammePublishedSeed,
    hasLinkedAthlete,
    allowLinkedProgrammeAccess,
    clientLiveProgrammePublished,
  });

  if (allowed) {
    return <>{children}</>;
  }

  const debugPanel =
    process.env.NODE_ENV === "development" ? (
      <div className="mx-auto mb-4 max-w-lg rounded-lg border border-red-500/30 bg-red-950/25 p-3 text-[10px] font-mono text-red-100/90">
        <p className="font-semibold text-red-300">Dev — portal gate blocked</p>
        <p>route: {pathname}</p>
        <p>auth source: {portalAuthSource}</p>
        <p>athlete id: {routeAuthDebug?.athleteId ?? "—"}</p>
        <p>serverProgrammePublishedSeed: {serverProgrammePublishedSeed ? "yes" : "no"}</p>
        <p>programmeHubLive: {programmeHubLive ? "yes" : "no"}</p>
        <p>programmePublishedLive: {programmePublishedLive ? "yes" : "no"}</p>
        <p>clientLiveProgrammePublished: {clientLiveProgrammePublished ? "yes" : "no"}</p>
        <p>serverAuthConfirmed: {serverAuthConfirmed ? "yes" : "no"}</p>
        <p>hasLinkedAthlete: {hasLinkedAthlete ? "yes" : "no"}</p>
        <p>allowLinkedProgrammeAccess: {allowLinkedProgrammeAccess ? "yes" : "no"}</p>
        <p>reasonBlocked: {reasonBlocked}</p>
      </div>
    ) : null;

  if (hasLinkedAthlete) {
    return (
      <>
        {debugPanel}
        <ProgrammeWaitingCard />
      </>
    );
  }

  if (allowMockPreview) {
    return (
      <>
        {debugPanel}
        <PreviewGateCard />
      </>
    );
  }

  return (
    <>
      {debugPanel}
      <ProgrammeWaitingCard />
    </>
  );
}
