/** Isolated Community / HYROX Track athlete UX Lab. Not the 1-1 portal. */

export const COMMUNITY_ATHLETE_LAB_BASE = "/dev/community-athlete";

export const COMMUNITY_ATHLETE_LAB_NAV = [
  { href: COMMUNITY_ATHLETE_LAB_BASE, label: "Dashboard", liveHref: "/dashboard" },
  { href: `${COMMUNITY_ATHLETE_LAB_BASE}/programme`, label: "Programme", liveHref: "/dashboard/programme" },
  { href: `${COMMUNITY_ATHLETE_LAB_BASE}/progress`, label: "Progress", liveHref: "/dashboard/progress" },
  { href: `${COMMUNITY_ATHLETE_LAB_BASE}/habits`, label: "Habits", liveHref: "/dashboard/habits" },
  { href: `${COMMUNITY_ATHLETE_LAB_BASE}/check-in`, label: "Check-In", liveHref: "/dashboard/check-in" },
  { href: `${COMMUNITY_ATHLETE_LAB_BASE}/testing`, label: "Testing", liveHref: "/dashboard/testing" },
] as const;

export function communityAthleteLabNavIsActive(pathname: string, href: string): boolean {
  if (href === COMMUNITY_ATHLETE_LAB_BASE) {
    return pathname === COMMUNITY_ATHLETE_LAB_BASE;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
