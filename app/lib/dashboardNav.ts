/**
 * Paid dashboard secondary navigation — one list for consistent order and active matching.
 */

export type DashboardNavItem = {
  href: string;
  label: string;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/programme", label: "Programme" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/habits", label: "Habits" },
  { href: "/dashboard/check-in", label: "Check-In" },
  { href: "/dashboard/challenge", label: "Challenge" },
  { href: "/dashboard/assessment", label: "Assessment" },
  { href: "/dashboard/testing", label: "Testing" },
];

/** True when `pathname` should highlight the nav item for `href`. */
export function dashboardNavIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
