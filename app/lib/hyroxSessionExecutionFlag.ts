/**
 * Athlete fast execution chips — default OFF.
 * Coach Weekly Review adaptation UI does not use this flag.
 *
 * Env:
 *   HYROX_SESSION_EXECUTION_CHIPS_ENABLED=1
 *   HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS=uuid,...
 *   HYROX_SESSION_EXECUTION_CHIPS_DEV_ALL=1  (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxSessionExecutionChipsEnabled(athlete: {
  id?: string | null;
} | null | undefined): boolean {
  if (!athlete?.id) return false;
  if (process.env.HYROX_SESSION_EXECUTION_CHIPS_ENABLED === "1") return true;
  const ids = parseList(process.env.HYROX_SESSION_EXECUTION_CHIPS_ATHLETE_IDS);
  if (ids.includes(athlete.id)) return true;
  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_SESSION_EXECUTION_CHIPS_DEV_ALL === "1"
  ) {
    return true;
  }
  return false;
}

/** Client seed from athlete layout — same pattern as other HYROX flags. */
export function isHyroxSessionExecutionChipsEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}
