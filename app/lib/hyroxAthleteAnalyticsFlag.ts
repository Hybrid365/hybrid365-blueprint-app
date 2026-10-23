/**
 * HYROX athlete analytics Progress UI (default OFF).
 *
 * Env (primary):
 *   HYROX_ATHLETE_ANALYTICS_ENABLED=1
 *   HYROX_ATHLETE_ANALYTICS_ATHLETE_IDS=uuid,...
 *   HYROX_ATHLETE_ANALYTICS_ATHLETE_EMAILS=a@b,...
 *   HYROX_ATHLETE_ANALYTICS_DEV_ALL=1   (development only)
 *
 * HYROX_ANALYTICS_* is a compatibility alias only.
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function prefixEnabled(
  prefix: "HYROX_ANALYTICS_V1" | "HYROX_ATHLETE_ANALYTICS" | "HYROX_ANALYTICS",
  athlete: { id: string; email?: string | null }
): boolean {
  if (process.env[`${prefix}_ENABLED`] === "1") return true;
  const ids = parseList(process.env[`${prefix}_ATHLETE_IDS`]);
  if (ids.includes(athlete.id)) return true;
  const emails = parseList(process.env[`${prefix}_ATHLETE_EMAILS`]).map((email) => email.toLowerCase());
  if (athlete.email && emails.includes(athlete.email.trim().toLowerCase())) return true;
  if (process.env.NODE_ENV === "development" && process.env[`${prefix}_DEV_ALL`] === "1") return true;
  return false;
}

export function isHyroxAthleteAnalyticsEnabled(athlete: {
  id?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!athlete?.id) return false;
  if (prefixEnabled("HYROX_ANALYTICS_V1", { id: athlete.id, email: athlete.email })) return true;
  if (prefixEnabled("HYROX_ATHLETE_ANALYTICS", { id: athlete.id, email: athlete.email })) return true;
  if (prefixEnabled("HYROX_ANALYTICS", { id: athlete.id, email: athlete.email })) return true;
  return false;
}

export const isHyroxAnalyticsEnabled = isHyroxAthleteAnalyticsEnabled;

export function isHyroxAthleteAnalyticsEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}

export const isHyroxAnalyticsEnabledClient = isHyroxAthleteAnalyticsEnabledClient;

export const isHyroxAnalyticsV1Enabled = isHyroxAthleteAnalyticsEnabled;
export const isHyroxAnalyticsV1EnabledClient = isHyroxAthleteAnalyticsEnabledClient;
