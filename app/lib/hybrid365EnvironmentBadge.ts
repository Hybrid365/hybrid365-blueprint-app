export type EnvironmentBadge = {
  label: string;
  tone: "staging" | "danger";
};

type BadgeEnv = {
  HYROX_ENV?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  HYROX_PRODUCTION_SUPABASE_URL?: string;
};

const PRODUCTION_SUPABASE_REF = "uuqdgbsntdjhojjkjkgd";

function pointsAtProductionData(env: BadgeEnv): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!url) return false;
  const productionUrl = env.HYROX_PRODUCTION_SUPABASE_URL?.trim().replace(/\/+$/, "") ?? "";
  return url.includes(PRODUCTION_SUPABASE_REF) || (Boolean(productionUrl) && url === productionUrl);
}

/** Null on Vercel Production. Never null when a non-production build reads production data. */
export function environmentBadge(env: BadgeEnv = process.env): EnvironmentBadge | null {
  if (env.VERCEL_ENV === "production") return null;

  const nonProductionRuntime = env.VERCEL_ENV === "preview" || env.NODE_ENV !== "production" || env.HYROX_ENV === "staging";
  if (nonProductionRuntime && pointsAtProductionData(env)) {
    return { label: "PRODUCTION DATA", tone: "danger" };
  }
  if (env.HYROX_ENV === "staging") return { label: "STAGING", tone: "staging" };
  if (env.VERCEL_ENV === "preview") return { label: "PREVIEW", tone: "staging" };
  return null;
}
