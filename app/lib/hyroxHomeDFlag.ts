/**
 * Athlete Home D rollout — Mon–Sun training command centre.
 * Distinct from legacy Home V2. Default OFF.
 *
 * Env:
 *   HYROX_HOME_D_ATHLETE_IDS=uuid,...
 *   HYROX_HOME_D_DEV_ALL=1  (development only)
 *
 * Do NOT set a global HYROX_HOME_D_ENABLED=1 for production rollout.
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isHyroxHomeDEnabled(athlete?: {
  id?: string | null;
} | null): boolean {
  const id = athlete?.id?.trim();
  if (id) {
    const ids = parseList(process.env.HYROX_HOME_D_ATHLETE_IDS);
    if (ids.includes(id)) return true;
  }
  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_HOME_D_DEV_ALL === "1"
  ) {
    return true;
  }
  return false;
}

/** Client-safe mirror: only seeded boolean from server. */
export function isHyroxHomeDEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}
