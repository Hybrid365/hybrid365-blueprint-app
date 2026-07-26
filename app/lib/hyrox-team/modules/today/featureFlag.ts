/**
 * HYROX Team Today V2 rollout — allow-list only until validated.
 *
 * Env:
 *   HYROX_TODAY_V2_ENABLED=1              → all paid HYROX Team athletes
 *   HYROX_TODAY_V2_ATHLETE_IDS=uuid,...    → allow-list by athlete id
 *   HYROX_TODAY_V2_ATHLETE_EMAILS=a@b,... → allow-list by email (case-insensitive)
 *   HYROX_TODAY_V2_DEV_ALL=1              → all athletes in development only
 *
 * Default: OFF (legacy Home remains).
 */

function parseList(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isHyroxTodayV2Enabled(athlete: {
  id?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!athlete?.id) return false;

  if (process.env.HYROX_TODAY_V2_ENABLED === "1") return true;

  const ids = parseList(process.env.HYROX_TODAY_V2_ATHLETE_IDS);
  if (ids.includes(athlete.id)) return true;

  const emails = parseList(process.env.HYROX_TODAY_V2_ATHLETE_EMAILS).map((e) =>
    e.toLowerCase()
  );
  if (athlete.email && emails.includes(athlete.email.trim().toLowerCase())) return true;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_TODAY_V2_DEV_ALL === "1"
  ) {
    return true;
  }

  return false;
}

/** Client-safe mirror: only NEXT_PUBLIC_* or seeded boolean from server. */
export function isHyroxTodayV2EnabledClient(seedEnabled: boolean | undefined | null): boolean {
  return Boolean(seedEnabled);
}
