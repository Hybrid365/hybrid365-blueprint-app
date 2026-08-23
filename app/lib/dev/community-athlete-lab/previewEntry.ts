/**
 * Preview-only lab entry that stays on `/`.
 * Vercel Shareable Links authenticate the deployment root; a different path
 * is treated as a different URL and bounces iPhone back to the homepage.
 */

import { COMMUNITY_ATHLETE_LAB_BASE } from "@/app/lib/dev/community-athlete-lab/labNav";

export const UX_LAB_QUERY_KEY = "uxlab";

const VERCEL_ACCESS_QUERY_KEYS = ["_vercel_share", "x-vercel-protection-bypass"] as const;

export const UX_LAB_QUERY_REWRITES = [
  { query: "1", destination: COMMUNITY_ATHLETE_LAB_BASE },
  { query: "programme", destination: `${COMMUNITY_ATHLETE_LAB_BASE}/programme` },
  { query: "progress", destination: `${COMMUNITY_ATHLETE_LAB_BASE}/progress` },
  { query: "habits", destination: `${COMMUNITY_ATHLETE_LAB_BASE}/habits` },
  { query: "check-in", destination: `${COMMUNITY_ATHLETE_LAB_BASE}/check-in` },
  { query: "testing", destination: `${COMMUNITY_ATHLETE_LAB_BASE}/testing` },
] as const;

export function firstSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function normalizeUxLabQuery(value: string): string {
  if (value === "home") return "1";
  if (UX_LAB_QUERY_REWRITES.some((item) => item.query === value)) return value;
  return "1";
}

export function labPathToUxLabQuery(href: string): string {
  if (href === COMMUNITY_ATHLETE_LAB_BASE) return "1";
  const rest = href.slice(COMMUNITY_ATHLETE_LAB_BASE.length).replace(/^\//, "");
  return rest || "1";
}

export function uxLabQueryToPath(value: string | null): string | null {
  if (!value) return null;
  const match = UX_LAB_QUERY_REWRITES.find((item) => item.query === value);
  return match?.destination ?? null;
}

export function pickLabAccessQuery(
  params: Record<string, string | string[] | undefined>
): URLSearchParams {
  const next = new URLSearchParams();
  for (const key of VERCEL_ACCESS_QUERY_KEYS) {
    const value = firstSearchParam(params[key]);
    if (value) next.set(key, value);
  }
  return next;
}

export function buildLabHref(href: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const key of VERCEL_ACCESS_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value) next.set(key, value);
  }
  next.set(UX_LAB_QUERY_KEY, labPathToUxLabQuery(href));
  return `/?${next.toString()}`;
}

export function resolveLabPathname(pathname: string, uxlab: string | null): string {
  return uxLabQueryToPath(uxlab) ?? pathname;
}

export function uxLabFromQueryString(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const decoded = raw.includes("%") ? decodeURIComponent(raw) : raw;
    const query = decoded.startsWith("http")
      ? new URL(decoded).searchParams
      : new URLSearchParams(decoded.startsWith("?") ? decoded.slice(1) : decoded);
    const value = query.get(UX_LAB_QUERY_KEY);
    return value || undefined;
  } catch {
    return undefined;
  }
}

export function uxLabFromSearchParams(
  params: Record<string, string | string[] | undefined>
): string | undefined {
  return firstSearchParam(params[UX_LAB_QUERY_KEY]);
}
