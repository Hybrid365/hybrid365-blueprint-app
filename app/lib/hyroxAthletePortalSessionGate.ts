import type { PortalLayoutAuth } from "@/components/athlete-command-centre/athletePortalContext";
import type { HyroxPortalSnapshotAuthProbe } from "@/app/lib/hyroxAthletePortalSnapshot";

/** True when layout + merged cookies indicate a real Supabase session (not name-only markers). */
export function athletePortalHasValidServerSession(input: {
  layoutAuth: PortalLayoutAuth;
  serverAuthConfirmed: boolean;
  authProbe?: Pick<
    HyroxPortalSnapshotAuthProbe,
    "validSessionCookiesPresent" | "getSessionSucceeded" | "getUserSucceeded"
  > | null;
}): boolean {
  if (!input.layoutAuth.hasSession || !input.layoutAuth.userId) return false;
  if (!input.serverAuthConfirmed) return false;
  if (input.authProbe) {
    return (
      input.authProbe.validSessionCookiesPresent &&
      (input.authProbe.getSessionSucceeded || input.authProbe.getUserSucceeded)
    );
  }
  return true;
}
