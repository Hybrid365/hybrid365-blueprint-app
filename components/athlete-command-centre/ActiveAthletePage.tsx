"use client";

import { AthletePortalGate, AthletePortalShell } from "./AthletePortalShell";

type GateMode = "published" | "linked" | "none";

/**
 * Athlete page chrome + optional programme gate.
 *
 * - published: classic hub — needs published programme / hub live
 * - linked: Programme / testing — linked paid athlete is enough
 * - none: Progress / Performance — never wall behind "programme not live";
 *   pages render sparse real UI when data is missing
 */
export function ActiveAthletePage({
  children,
  allowLinkedProgrammeAccess = false,
  gate,
}: {
  children: React.ReactNode;
  /** @deprecated Prefer gate="linked". Kept for existing Programme/testing call sites. */
  allowLinkedProgrammeAccess?: boolean;
  gate?: GateMode;
}) {
  const resolvedGate: GateMode =
    gate ?? (allowLinkedProgrammeAccess ? "linked" : "published");

  return (
    <AthletePortalShell
      showNavWhenLinked={resolvedGate === "linked" || resolvedGate === "none"}
      forceShowNav={resolvedGate === "none"}
    >
      {resolvedGate === "none" ? (
        children
      ) : (
        <AthletePortalGate allowLinkedProgrammeAccess={resolvedGate === "linked"}>
          {children}
        </AthletePortalGate>
      )}
    </AthletePortalShell>
  );
}
