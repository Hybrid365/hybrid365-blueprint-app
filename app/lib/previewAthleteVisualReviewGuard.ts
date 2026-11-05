/**
 * Authless athlete UI visual-review routes (`/preview/athlete/*`).
 *
 * Hard-fails in Production. Presentation fixtures only — never live athlete data.
 */

export type PreviewAthleteVisualReviewEnv = {
  VERCEL_ENV?: string;
  HYROX_ENV?: string;
  NODE_ENV?: string;
};

/**
 * Allowed only on local development, Vercel Preview, or explicit HYROX_ENV=staging.
 * Always refused when Vercel or HYROX env claims production.
 */
export function isAthleteVisualReviewPreviewAllowed(
  env: PreviewAthleteVisualReviewEnv = process.env
): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.HYROX_ENV === "production") return false;
  return (
    env.VERCEL_ENV === "preview" ||
    env.HYROX_ENV === "staging" ||
    env.NODE_ENV === "development"
  );
}
