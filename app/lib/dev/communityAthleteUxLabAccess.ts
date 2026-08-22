/**
 * Community Athlete UX Lab — never enable on Vercel production.
 * Preview + local remain available; data is mock-only.
 */

export function isCommunityAthleteUxLabEnabled(): boolean {
  return process.env.VERCEL_ENV !== "production";
}
