"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { athleteProgrammePrefetchDisabled } from "./athleteNav";

const ATHLETE_PUBLIC_PATHS = [
  "/athlete/login",
  "/athlete/no-access",
  "/athlete/auth-debug",
];

/**
 * Inside the authenticated athlete portal, use full document navigation between
 * protected pages so middleware/layout receive a complete Cookie header (avoids
 * RSC soft-nav false logouts).
 */
export function isAthletePortalFullPageNav(href: string, currentPath: string): boolean {
  if (!currentPath.startsWith("/athlete/")) return false;
  if (ATHLETE_PUBLIC_PATHS.some((p) => currentPath === p || currentPath.startsWith(`${p}/`))) {
    return false;
  }
  if (!href.startsWith("/athlete/")) return false;
  if (ATHLETE_PUBLIC_PATHS.some((p) => href === p || href.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}

export function AthletePortalNavLink({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const fullPage = isAthletePortalFullPageNav(href, pathname);

  if (fullPage) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      prefetch={athleteProgrammePrefetchDisabled(href) ? false : undefined}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
