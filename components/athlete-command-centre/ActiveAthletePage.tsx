"use client";

import { AthletePortalGate, AthletePortalShell } from "./AthletePortalShell";

export function ActiveAthletePage({
  children,
  allowLinkedProgrammeAccess = false,
}: {
  children: React.ReactNode;
  /** Linked athletes can open /athlete/programme without client API setting programmeHubLive first. */
  allowLinkedProgrammeAccess?: boolean;
}) {
  return (
    <AthletePortalShell showNavWhenLinked={allowLinkedProgrammeAccess}>
      <AthletePortalGate allowLinkedProgrammeAccess={allowLinkedProgrammeAccess}>
        {children}
      </AthletePortalGate>
    </AthletePortalShell>
  );
}
