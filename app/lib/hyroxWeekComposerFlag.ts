/**
 * Week Composer coach UX — default OFF.
 *
 * Env:
 *   HYROX_WEEK_COMPOSER_ENABLED=1
 *   HYROX_WEEK_COMPOSER_ATHLETE_IDS=uuid,...
 *   HYROX_WEEK_COMPOSER_DEV_ALL=1  (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxWeekComposerEnabled(athlete?: {
  id?: string | null;
} | null): boolean {
  if (process.env.HYROX_WEEK_COMPOSER_ENABLED === "1") return true;
  const id = athlete?.id?.trim();
  if (id) {
    const ids = parseList(process.env.HYROX_WEEK_COMPOSER_ATHLETE_IDS);
    if (ids.includes(id)) return true;
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_WEEK_COMPOSER_DEV_ALL === "1"
  ) {
    return true;
  }
  return false;
}

export function isHyroxWeekComposerEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}
