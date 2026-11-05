/**
 * Staging / Preview-only Demo Competitive password login helpers.
 * Never enable against Production Supabase.
 */

export const STAGING_DEMO_COMPETITIVE_EMAIL = "demo.competitive@hybrid365.test";

/** Known staging Supabase project ref (hybrid365-staging). */
export const STAGING_SUPABASE_REF = "bfwboqaovirzjpxpwgty";
const PRODUCTION_SUPABASE_REF = "uuqdgbsntdjhojjkjkgd";

export type StagingDemoAuthEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_VERCEL_ENV?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

/**
 * Client/server gate for the Demo Competitive password form.
 * Requires non-production runtime AND non-production Supabase URL.
 */
export function isStagingDemoPasswordLoginAllowed(
  env: StagingDemoAuthEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  }
): boolean {
  const vercelEnv = env.VERCEL_ENV || env.NEXT_PUBLIC_VERCEL_ENV;
  if (vercelEnv === "production") return false;

  const url = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").toLowerCase();
  if (!url || url.includes(PRODUCTION_SUPABASE_REF)) return false;

  const nonProdRuntime =
    vercelEnv === "preview" ||
    env.NODE_ENV === "development" ||
    url.includes(STAGING_SUPABASE_REF);

  return nonProdRuntime && url.includes(STAGING_SUPABASE_REF);
}
