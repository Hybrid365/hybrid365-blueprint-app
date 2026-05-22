import type { PortalAthleteSummary, PortalLayoutAuth, PortalMatchSource } from "@/components/athlete-command-centre/athletePortalContext";

/**
 * Server-resolved Hyrox athlete auth from app/athlete/layout.tsx.
 * Child pages and client mutations must treat this as authoritative for
 * "signed in + linked" — client API failures must not downgrade it.
 */
export type HyroxPortalServerAuth = {
  layoutAuth: PortalLayoutAuth;
  hasLinkedAthlete: boolean;
  portalAthlete: PortalAthleteSummary | null;
  portalMatchSource: PortalMatchSource;
  /** Layout passed all gates and rendered portal children for a linked paid athlete. */
  serverAuthConfirmed: boolean;
};

export function buildHyroxPortalServerAuth(input: {
  layoutAuth: PortalLayoutAuth;
  hasLinkedAthlete: boolean;
  portalAthlete: PortalAthleteSummary | null;
  portalMatchSource: PortalMatchSource;
}): HyroxPortalServerAuth {
  return {
    ...input,
    serverAuthConfirmed: Boolean(
      input.layoutAuth.hasSession &&
        input.hasLinkedAthlete &&
        input.portalAthlete?.id
    ),
  };
}
