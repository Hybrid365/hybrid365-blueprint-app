import type { PortalAthleteSummary } from "@/components/athlete-command-centre/athletePortalContext";

export function portalAthleteDisplayName(portalAthlete: PortalAthleteSummary | null | undefined): string {
  return portalAthlete?.name?.trim() || "Athlete";
}
