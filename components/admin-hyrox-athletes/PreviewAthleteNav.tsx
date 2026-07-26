"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { MoreHorizontal, X } from "lucide-react";
import {
  ATHLETE_DESKTOP_NAV,
  ATHLETE_MOBILE_MORE,
  ATHLETE_MOBILE_PRIMARY,
  type AthleteNavItem,
} from "@/components/athlete-command-centre/athleteNav";
import { athleteHrefToPreviewSection } from "@/app/lib/hyroxAdminAthletePreviewPaths";

function mapItem(basePath: string, item: AthleteNavItem): { href: string; item: AthleteNavItem } {
  const section = athleteHrefToPreviewSection(item.href);
  const href = section ? `${basePath}/${section}` : basePath;
  return { href, item };
}

function isActive(pathname: string, href: string, basePath: string) {
  if (href === basePath) {
    return pathname === basePath || pathname === `${basePath}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Athlete-style nav remapped into the admin preview route tree.
 */
export function PreviewAthleteNav({
  basePath,
  variant = "all",
}: {
  basePath: string;
  variant?: "desktop" | "mobile" | "all";
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const showDesktop = variant === "desktop" || variant === "all";
  const showMobile = variant === "mobile" || variant === "all";

  return (
    <>
      {showDesktop ? (
        <nav className="hidden border-t border-zinc-800/60 lg:block" aria-label="Athlete preview">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-2.5 sm:px-6">
            {ATHLETE_DESKTOP_NAV.map((item) => {
              const mapped = mapItem(basePath, item);
              const active = isActive(pathname, mapped.href, basePath);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={mapped.href}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-yellow-400/15 text-yellow-300 ring-1 ring-yellow-400/30"
                      : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}

      {showMobile ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/95 backdrop-blur-md lg:hidden"
          aria-label="Athlete preview mobile"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1">
            {ATHLETE_MOBILE_PRIMARY.map((item) => {
              const mapped = mapItem(basePath, item);
              const active = isActive(pathname, mapped.href, basePath);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={mapped.href}
                  className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
                    active ? "text-yellow-400" : "text-zinc-500"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-yellow-400" : ""}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold text-zinc-500"
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </div>
        </nav>
      ) : null}

      {moreOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-zinc-700 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-white">More</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2">
              {ATHLETE_MOBILE_MORE.map((item) => {
                const mapped = mapItem(basePath, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={mapped.href}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-zinc-800 px-3 py-3 text-sm font-semibold text-zinc-200"
                  >
                    <Icon className="h-4 w-4 text-yellow-400" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
