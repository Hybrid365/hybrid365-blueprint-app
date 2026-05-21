/**
 * Hyrox Team profile roles (stored on public.profiles.role).
 * `member` = default for existing Hybrid365 dashboard users (no Hyrox portal access).
 */

export const PROFILE_ROLES = ["member", "athlete", "coach", "admin"] as const;

export type ProfileRole = (typeof PROFILE_ROLES)[number];

export const HYROX_COACH_ROLES: ProfileRole[] = ["coach", "admin"];

export function isHyroxCoachRole(role: string | null | undefined): boolean {
  return role === "coach" || role === "admin";
}

export function isHyroxAthleteRole(role: string | null | undefined): boolean {
  return role === "athlete";
}
