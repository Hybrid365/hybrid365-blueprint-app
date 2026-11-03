/**
 * Fail-closed runtime guard: HYROX_ENV=staging must never point at production data.
 * Production Vercel remains untouched (VERCEL_ENV=production skips the hard throw).
 */

export const HYROX_PRODUCTION_SUPABASE_REF = "uuqdgbsntdjhojjkjkgd";

/** Historical hybrid365-staging ref — may be unavailable; do not invent a replacement. */
export const HYROX_DOCUMENTED_STAGING_SUPABASE_REF = "uluapwqohujavhlpucta";

export type HyroxRuntimeEnv = {
  HYROX_ENV?: string;
  VERCEL_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  HYROX_PRODUCTION_SUPABASE_URL?: string;
  [key: string]: string | undefined;
};

export function supabaseProjectRefFromUrl(url: string | undefined | null): string | null {
  const raw = (url ?? "").trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname;
    const m = /^([a-z0-9]{20})\.supabase\.co$/i.exec(host);
    return m?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function pointsAtProductionSupabase(env: HyroxRuntimeEnv = process.env): boolean {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!url) return false;
  const productionUrl = (env.HYROX_PRODUCTION_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  if (productionUrl && url === productionUrl) return true;
  const ref = supabaseProjectRefFromUrl(url);
  if (ref === HYROX_PRODUCTION_SUPABASE_REF) return true;
  return url.includes(HYROX_PRODUCTION_SUPABASE_REF);
}

/**
 * Hard mismatch: claiming staging while the Supabase URL is production.
 * Returns an error message, or null when consistent.
 */
export function hyroxStagingProductionMismatchMessage(
  env: HyroxRuntimeEnv = process.env
): string | null {
  if (env.HYROX_ENV !== "staging") return null;
  if (!pointsAtProductionSupabase(env)) return null;
  return (
    "HYROX_ENV=staging but NEXT_PUBLIC_SUPABASE_URL points at the production Supabase project. " +
    "Refusing to boot a false staging environment."
  );
}

/**
 * Call from server entry (layout). Throws on staging↔production mismatch.
 * Skips when VERCEL_ENV=production so live production is never blocked by this guard.
 */
export function assertHyroxRuntimeEnvironment(env: HyroxRuntimeEnv = process.env): void {
  if (env.VERCEL_ENV === "production") return;
  const message = hyroxStagingProductionMismatchMessage(env);
  if (message) throw new Error(message);
}

/**
 * Preview without an explicit HYROX_ENV that still reads production data.
 * Not a hard boot failure (legacy Preview still shares Production credentials),
 * but must never be treated as a staging canary.
 */
export function previewReadsProductionWithoutStagingClaim(
  env: HyroxRuntimeEnv = process.env
): boolean {
  return (
    env.VERCEL_ENV === "preview" &&
    env.HYROX_ENV !== "staging" &&
    pointsAtProductionSupabase(env)
  );
}
