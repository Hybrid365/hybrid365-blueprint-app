/**
 * Daily readiness is off unless one athlete is named.
 * Production also needs the allowlist.
 * Track adaptation cannot turn on in production.
 */

function listed(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/[,;\s]+/).map((item) => item.trim()).filter(Boolean);
}

function production(env: Record<string, string | undefined>): boolean {
  if (env.VERCEL_ENV === "production" || env.HYROX_ENV === "production") return true;
  if (env.HYROX_ENV === "staging" || env.VERCEL_ENV === "preview") return false;
  return env.NODE_ENV === "production";
}

export function isDailyReadinessEnabled(
  athleteId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!athleteId) return false;
  if (env.HYROX_DAILY_READINESS_V1 !== "1") return false;
  if (production(env) && env.HYROX_DAILY_READINESS_V1_PRODUCTION_ALLOWLIST !== "1") return false;
  return listed(env.HYROX_DAILY_READINESS_V1_ATHLETE_IDS).includes(athleteId);
}

export function isTrackAdaptationEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (production(env)) return false;
  return env.HYROX_TRACK_ADAPTATION_V1 === "1";
}
