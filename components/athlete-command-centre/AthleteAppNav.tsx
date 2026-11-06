"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, X } from "lucide-react";
import { AthletePortalNavLink } from "./AthletePortalNavLink";
import {
  visibleAthleteNavItems,
  visibleHomeDNavItems,
  type AthleteNavItem,
} from "./athleteNav";
import { useAthletePortalOptional } from "./athletePortalContext";
import { useAthleteAdminPreview } from "./athletePortalAdminPreview";
import { isHyroxHomeDEnabledClient } from "@/app/lib/hyroxHomeDFlag";
import {
  usePrefersReducedMotion,
  vsTransition,
  VS_DURATION,
} from "./visual-system/motion";

function isActive(pathname: string, href: string) {
  if (href === "/athlete/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useAthleteNavItems() {
  const pathname = usePathname();
  const portal = useAthletePortalOptional();
  const preview = useAthleteAdminPreview();
  const homeD = isHyroxHomeDEnabledClient(
    preview?.homeDEnabled ?? portal?.homeDEnabled ?? false
  );
  const raceIntelligenceEnabled =
    preview?.raceIntelligenceEnabled ?? portal?.raceIntelligenceEnabled ?? false;
  const items = homeD
    ? visibleHomeDNavItems({ raceIntelligenceEnabled })
    : visibleAthleteNavItems({ raceIntelligenceEnabled });
  return { pathname, items, portal, homeD };
}

/** Desktop left-rail links — mirrors HomeConceptD aside (220px rail). */
export function AthleteDesktopRailNav() {
  const { pathname, items } = useAthleteNavItems();
  const reduced = usePrefersReducedMotion();
  // Primary destinations only — More sheet items stay off the rail.
  const railItems = items.filter((item) => item.mobilePrimary);

  return (
    <nav className="mt-8 space-y-1" aria-label="Athlete portal" data-athlete-rail-nav="">
      {railItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <AthletePortalNavLink
            key={item.id}
            href={item.href}
            data-athlete-nav={item.id}
            data-active={active ? "true" : undefined}
            className="relative flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-sm transition-colors"
          >
            {active ? (
              <motion.span
                layoutId={reduced ? undefined : "athlete-rail-active"}
                className="absolute inset-0 rounded-lg bg-zinc-900/50"
                transition={vsTransition(reduced, VS_DURATION.normal)}
                aria-hidden
              />
            ) : null}
            <Icon
              className={`relative h-4 w-4 shrink-0 ${
                active ? "text-yellow-400" : "text-zinc-500"
              }`}
              aria-hidden
            />
            <span
              className={`relative ${
                active ? "font-medium text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </span>
          </AthletePortalNavLink>
        );
      })}
    </nav>
  );
}

/** Mobile sticky bottom shelf — mirrors HomeConceptD HomeDNav. */
export function AthleteMobileBottomNav() {
  const { pathname, items } = useAthleteNavItems();
  const [moreOpen, setMoreOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const mobilePrimary = items.filter((item) => item.mobilePrimary);
  const mobileMore = items.filter((item) => item.mobileMore);
  const moreActive = mobileMore.some((i) => isActive(pathname, i.href));

  // v0 uses 5 columns: Home Programme Progress Performance More
  const primarySlots = mobilePrimary.slice(0, 4);

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden" data-athlete-mobile-nav="">
        <AnimatePresence>
          {moreOpen ? (
            <motion.div
              key="more-sheet"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: 8 }}
              transition={vsTransition(reduced, VS_DURATION.normal)}
              className="mx-3 mb-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400/90">
                  More
                </p>
                <button
                  type="button"
                  aria-label="Close more"
                  onClick={() => setMoreOpen(false)}
                  className="text-zinc-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid gap-1">
                {mobileMore.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <AthletePortalNavLink
                      key={item.id}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm ${
                        active ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${active ? "text-yellow-400" : "text-zinc-500"}`}
                      />
                      {item.label}
                    </AthletePortalNavLink>
                  );
                })}
                <a
                  href="/logout?next=/athlete/login"
                  className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-zinc-400"
                  onClick={() => setMoreOpen(false)}
                >
                  Sign out
                </a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <nav
          aria-label="Athlete portal mobile"
          className="border-t border-zinc-800 bg-black/95 px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur"
        >
          <ul className="mx-auto grid max-w-lg grid-cols-5">
            {primarySlots.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <li key={item.id}>
                  <AthletePortalNavLink
                    href={item.href}
                    data-athlete-nav={item.id}
                    data-active={active ? "true" : undefined}
                    className="relative flex min-h-11 w-full flex-col items-center justify-center gap-1 py-2"
                  >
                    {active ? (
                      <motion.span
                        layoutId={reduced ? undefined : "athlete-mobile-active"}
                        className="absolute inset-x-2 inset-y-1 rounded-lg bg-zinc-900/40"
                        transition={vsTransition(reduced, VS_DURATION.normal)}
                        aria-hidden
                      />
                    ) : null}
                    <Icon
                      className={`relative h-5 w-5 ${
                        active ? "text-yellow-400" : "text-zinc-500"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`relative text-[10px] font-medium ${
                        active ? "text-zinc-100" : "text-zinc-500"
                      }`}
                    >
                      {item.label}
                    </span>
                  </AthletePortalNavLink>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                data-athlete-nav="more"
                data-active={moreActive || moreOpen ? "true" : undefined}
                onClick={() => setMoreOpen((o) => !o)}
                className="relative flex min-h-11 w-full flex-col items-center justify-center gap-1 py-2"
              >
                {(moreActive || moreOpen) && !reduced ? (
                  <motion.span
                    layoutId="athlete-mobile-active"
                    className="absolute inset-x-2 inset-y-1 rounded-lg bg-zinc-900/40"
                    transition={vsTransition(reduced, VS_DURATION.normal)}
                    aria-hidden
                  />
                ) : moreActive || moreOpen ? (
                  <span
                    className="absolute inset-x-2 inset-y-1 rounded-lg bg-zinc-900/40"
                    aria-hidden
                  />
                ) : null}
                <MoreHorizontal
                  className={`relative h-5 w-5 ${
                    moreActive || moreOpen ? "text-yellow-400" : "text-zinc-500"
                  }`}
                />
                <span
                  className={`relative text-[10px] font-medium ${
                    moreActive || moreOpen ? "text-zinc-100" : "text-zinc-500"
                  }`}
                >
                  More
                </span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {moreOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/70 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}
    </>
  );
}

/**
 * @deprecated Prefer AthleteDesktopRailNav / AthleteMobileBottomNav via AthletePortalShell.
 * Kept for any direct imports; renders mobile shelf only.
 */
export function AthleteAppNav({ variant = "all" }: { variant?: "desktop" | "mobile" | "all" }) {
  if (variant === "desktop") return null;
  return <AthleteMobileBottomNav />;
}

export type { AthleteNavItem };
