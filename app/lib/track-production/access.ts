import { TRACK_PROGRAMME_MUTATION_ENABLED } from "@/app/lib/track-foundation/productionBoundary";
import { isInternalAdminEmail } from "@/app/lib/internalAdminAccess";

export const PRODUCTION_TRACK_CANARY_ATHLETE_ID = "97919cf6-6574-4ec1-8532-7a295b3e52ee";
export const PRODUCTION_TRACK_CANARY_AUTH_USER_ID = "31115568-5181-479d-ad17-4d653c7f8fa8";
export const PRODUCTION_TRACK_JOURNEY_ATHLETE_ID = "14d1d4e4-71aa-43e3-bbd7-2a221b7f75cd";
export const PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID = "37edd473-e194-4903-b08c-0ba36ec6fdef";
export const PRODUCTION_TRACK_SUPABASE_REF = "uuqdgbsntdjhojjkjkgd";

export function productionTrackRef(url: string | undefined): string | null {
  const match = (url ?? "").match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

/** Kill switch: access is on only when this env value is exactly "1". */
export function productionTrackAccessEnabled(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) return false;
  if (env.HYROX_TRACK_PRODUCTION_CANARY !== "1") return false;
  return productionTrackRef(env.NEXT_PUBLIC_SUPABASE_URL) === PRODUCTION_TRACK_SUPABASE_REF;
}

export function productionTrackAllowsUser(
  user: { id?: string | null; email?: string | null } | null | undefined
): boolean {
  if (!productionTrackAccessEnabled()) return false;
  if (!user?.id) return false;
  if (user.id === PRODUCTION_TRACK_CANARY_AUTH_USER_ID) return true;
  if (user.id === PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID) return true;
  return isInternalAdminEmail(user.email);
}

/** Identity half of the Whop exception. The other half is the linked athlete and membership. */
export function isTrackJourneyWhopException(
  userId: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): boolean {
  return productionTrackAccessEnabled(env) && userId === PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID;
}

export function assertTrackMutationStaysOff(): void {
  if (TRACK_PROGRAMME_MUTATION_ENABLED !== false) {
    throw new Error("Track programme mutation must stay off.");
  }
}

export function refuseProductionProgrammeWrite(): void {
  assertTrackMutationStaysOff();
  if (productionTrackAccessEnabled()) {
    throw new Error("Track programme mutation is off for the production canary.");
  }
}
