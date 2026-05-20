"use client";

import { AthletePortalGate, AthletePortalShell } from "./AthletePortalShell";

export function ActiveAthletePage({ children }: { children: React.ReactNode }) {
  return (
    <AthletePortalShell>
      <AthletePortalGate>{children}</AthletePortalGate>
    </AthletePortalShell>
  );
}
