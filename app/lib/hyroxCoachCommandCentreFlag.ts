/**
 * Coach Command Centre Overview (default OFF).
 *
 *   HYROX_COACH_COMMAND_CENTRE_ENABLED=1
 *   HYROX_COACH_COMMAND_CENTRE_ATHLETE_IDS=uuid,...
 *   HYROX_COACH_COMMAND_CENTRE_DEV_ALL=1   (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxCoachCommandCentreEnabled(athlete?: {
  id?: string | null;
} | null): boolean {
  if (process.env.HYROX_COACH_COMMAND_CENTRE_ENABLED === "1") return true;
  const id = athlete?.id?.trim();
  if (id) {
    const ids = parseList(process.env.HYROX_COACH_COMMAND_CENTRE_ATHLETE_IDS);
    if (ids.includes(id)) return true;
  }
  if (process.env.NODE_ENV === "development" && process.env.HYROX_COACH_COMMAND_CENTRE_DEV_ALL === "1") {
    return true;
  }
  return false;
}
