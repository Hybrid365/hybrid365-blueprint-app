/**
 * HYROX Team Performance Hub — independent rollout flag (default OFF).
 *
 * Env:
 *   HYROX_PERFORMANCE_HUB_ENABLED=1
 *   HYROX_PERFORMANCE_HUB_ATHLETE_IDS=uuid,...
 *   HYROX_PERFORMANCE_HUB_ATHLETE_EMAILS=a@b,...
 *   HYROX_PERFORMANCE_HUB_DEV_ALL=1   (development only)
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isHyroxPerformanceHubEnabled(athlete: {
  id?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!athlete?.id) return false;
  if (process.env.HYROX_PERFORMANCE_HUB_ENABLED === "1") return true;

  const ids = parseList(process.env.HYROX_PERFORMANCE_HUB_ATHLETE_IDS);
  if (ids.includes(athlete.id)) return true;

  const emails = parseList(process.env.HYROX_PERFORMANCE_HUB_ATHLETE_EMAILS).map((e) =>
    e.toLowerCase()
  );
  if (athlete.email && emails.includes(athlete.email.trim().toLowerCase())) return true;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_PERFORMANCE_HUB_DEV_ALL === "1"
  ) {
    return true;
  }

  return false;
}

export function isHyroxPerformanceHubEnabledClient(
  seedEnabled: boolean | undefined | null
): boolean {
  return Boolean(seedEnabled);
}
