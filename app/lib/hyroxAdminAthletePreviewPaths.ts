/**
 * Client-safe path helpers for HYROX Team admin athlete preview.
 * Keep free of next/headers and node:crypto so Client Components can import.
 */

export const HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE = "hyrox_admin_athlete_preview";
export const HYROX_ADMIN_ATHLETE_PREVIEW_HEADER = "x-hyrox-admin-preview";

/** Map athlete portal path → preview section slug. */
export function athleteHrefToPreviewSection(href: string): string {
  if (href === "/athlete/dashboard" || href === "/athlete") return "";
  const stripped = href.replace(/^\/athlete\//, "");
  return stripped || "";
}

export function previewPathForAthlete(athleteId: string, section = ""): string {
  const base = `/admin/hyrox-athletes/${athleteId}/preview`;
  return section ? `${base}/${section}` : base;
}

export function previewSectionFromPath(pathname: string, athleteId: string): string {
  const prefix = `/admin/hyrox-athletes/${athleteId}/preview`;
  if (!pathname.startsWith(prefix)) return "";
  const rest = pathname.slice(prefix.length).replace(/^\//, "");
  return rest.split("/")[0] ?? "";
}
