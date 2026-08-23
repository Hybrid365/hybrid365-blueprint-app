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

export function shouldUseRootUxLabEntry(searchParams: Pick<URLSearchParams, "has">): boolean {
  return (
    searchParams.has(UX_LAB_QUERY_KEY) ||
    VERCEL_ACCESS_QUERY_KEYS.some((key) => searchParams.has(key))
  );
}

export function buildLabHref(href: string, searchParams: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const key of VERCEL_ACCESS_QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value) next.set(key, value);
  }

  if (shouldUseRootUxLabEntry(searchParams)) {
    next.set(UX_LAB_QUERY_KEY, labPathToUxLabQuery(href));
    const qs = next.toString();
    return qs ? `/?${qs}` : `/?${UX_LAB_QUERY_KEY}=1`;
  }

  const qs = next.toString();
  return qs ? `${href}?${qs}` : href;
}

export function resolveLabPathname(pathname: string, uxlab: string | null): string {
  return uxLabQueryToPath(uxlab) ?? pathname;
}
