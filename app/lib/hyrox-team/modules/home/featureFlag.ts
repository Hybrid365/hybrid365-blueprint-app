/**
 * HYROX Team Home V2 rollout — consolidated athlete Home layout.
 *
 * Independent from Today V2: Home V2 is composition/layout; Today V2 governs
 * readiness submission. Athletes may have either, both, or neither during rollout.
 *
 * Env:
 *   HYROX_HOME_V2_ENABLED=1
 *   HYROX_HOME_V2_ATHLETE_IDS=uuid,...
 *   HYROX_HOME_V2_ATHLETE_EMAILS=a@b,...
 *   HYROX_HOME_V2_DEV_ALL=1   (development only)
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

export function isHyroxHomeV2Enabled(athlete: {
  id?: string | null;
  email?: string | null;
} | null | undefined): boolean {
  if (!athlete?.id) return false;

  if (process.env.HYROX_HOME_V2_ENABLED === "1") return true;

  const ids = parseList(process.env.HYROX_HOME_V2_ATHLETE_IDS);
  if (ids.includes(athlete.id)) return true;

  const emails = parseList(process.env.HYROX_HOME_V2_ATHLETE_EMAILS).map((e) =>
    e.toLowerCase()
  );
  if (athlete.email && emails.includes(athlete.email.trim().toLowerCase())) return true;

  if (
    process.env.NODE_ENV === "development" &&
    process.env.HYROX_HOME_V2_DEV_ALL === "1"
  ) {
    return true;
  }

  return false;
}

/** Client-safe mirror: only seeded boolean from server. */
export function isHyroxHomeV2EnabledClient(seedEnabled: boolean | undefined | null): boolean {
  return Boolean(seedEnabled);
}
