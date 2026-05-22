"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import {
  ATHLETE_DESKTOP_NAV,
  ATHLETE_MOBILE_MORE,
  ATHLETE_MOBILE_PRIMARY,
  type AthleteNavItem,
} from "./athleteNav";

function isActive(pathname: string, href: string) {
  if (href === "/athlete/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, active, onClick }: { item: AthleteNavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch={false}
      onClick={onClick}
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
}

type AthleteAppNavProps = {
  variant?: "desktop" | "mobile" | "all";
};

export function AthleteAppNav({ variant = "all" }: AthleteAppNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const showDesktop = variant === "desktop" || variant === "all";
  const showMobile = variant === "mobile" || variant === "all";

  return (
    <>
      {showDesktop ? (
        <nav
          className="hidden border-t border-zinc-800/60 lg:block"
          aria-label="Athlete portal"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-1.5 px-4 py-2.5 sm:px-6">
            {ATHLETE_DESKTOP_NAV.map((item) => (
              <NavLink key={item.id} item={item} active={isActive(pathname, item.href)} />
            ))}
          </div>
        </nav>
      ) : null}

      {showMobile ? (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/95 backdrop-blur-md lg:hidden"
          aria-label="Athlete portal mobile"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1">
            {ATHLETE_MOBILE_PRIMARY.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={false}
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
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
                ATHLETE_MOBILE_MORE.some((i) => isActive(pathname, i.href)) ? "text-yellow-400" : "text-zinc-500"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              More
            </button>
          </div>
        </nav>
      ) : null}

      {showMobile && moreOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-50 bg-black/70 lg:hidden"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border border-zinc-800 bg-zinc-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-white">More</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="text-zinc-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-2">
              {ATHLETE_MOBILE_MORE.map((item) => (
                <NavLink
                  key={item.id}
                  item={item}
                  active={isActive(pathname, item.href)}
                  onClick={() => setMoreOpen(false)}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
