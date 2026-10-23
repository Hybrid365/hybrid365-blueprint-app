/**
 * Race Intelligence athlete/coach surfaces (default OFF).
 *
 *   HYROX_RACE_INTELLIGENCE_ENABLED=1
 *   HYROX_RACE_INTELLIGENCE_ATHLETE_IDS=uuid,...
 *   HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS=a@b,...
 *   HYROX_RACE_INTELLIGENCE_DEV_ALL=1   (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxRaceIntelligenceEnabled(athlete: {
  id?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (process.env.HYROX_RACE_INTELLIGENCE_ENABLED === "1") return true;
  if (!athlete?.id) {
    return process.env.NODE_ENV === "development" && process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL === "1";
  }
  const ids = parseList(process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_IDS);
  if (ids.includes(athlete.id)) return true;
  const emails = parseList(process.env.HYROX_RACE_INTELLIGENCE_ATHLETE_EMAILS).map((email) =>
    email.toLowerCase()
  );
  if (athlete.email && emails.includes(athlete.email.trim().toLowerCase())) return true;
  if (process.env.NODE_ENV === "development" && process.env.HYROX_RACE_INTELLIGENCE_DEV_ALL === "1") {
    return true;
  }
  return false;
}

export function isHyroxRaceIntelligenceEnabledClient(seedEnabled: boolean | undefined | null): boolean {
  return Boolean(seedEnabled);
}
