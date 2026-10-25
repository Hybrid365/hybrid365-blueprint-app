/**
 * Session families / progressive programming coach UX (default OFF).
 *
 *   HYROX_SESSION_FAMILIES_ENABLED=1
 *   HYROX_SESSION_FAMILIES_ATHLETE_IDS=uuid,...
 *   HYROX_SESSION_FAMILIES_DEV_ALL=1   (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxSessionFamiliesEnabled(athlete?: {
  id?: string | null;
} | null): boolean {
  if (process.env.HYROX_SESSION_FAMILIES_ENABLED === "1") return true;
  const id = athlete?.id?.trim();
  if (id) {
    const ids = parseList(process.env.HYROX_SESSION_FAMILIES_ATHLETE_IDS);
    if (ids.includes(id)) return true;
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_SESSION_FAMILIES_DEV_ALL === "1"
  ) {
    return true;
  }
  return false;
}

/** Client-safe: only trust the server-seeded prop (same pattern as other HYROX flags). */
export function isHyroxSessionFamiliesEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}
