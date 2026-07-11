/** Homepage hero ecosystem — 4 premium mini UI cards around central phone. */

import type { PhoneScreenId } from "./phoneScreens";

export type EcosystemMiniCard = {
  id: string;
  title: string;
  caption: string;
  screenId: PhoneScreenId;
  /** Visible floating on mobile (max 2 around phone). */
  mobileFloat: boolean;
  desktopClass: string;
  mobileClass: string;
};

export const HERO_ECOSYSTEM_MINI_CARDS: EcosystemMiniCard[] = [
  {
    id: "today-session",
    title: "Today's Session",
    caption: "Hyrox Conditioning",
    screenId: "threshold-run",
    mobileFloat: true,
    desktopClass: "top-[10%] left-0 w-[108px] lg:w-[118px]",
    mobileClass: "top-[6%] left-0 w-[96px]",
  },
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    caption: "Sleep · Energy · Soreness",
    screenId: "weekly-check-in",
    mobileFloat: true,
    desktopClass: "top-[10%] right-0 w-[108px] lg:w-[118px]",
    mobileClass: "top-[6%] right-0 w-[96px]",
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    caption: "Race readiness 82%",
    screenId: "progress-overview",
    mobileFloat: false,
    desktopClass: "bottom-[10%] left-0 w-[108px] lg:w-[118px]",
    mobileClass: "bottom-[4%] left-[4%] w-[96px]",
  },
  {
    id: "benchmark-testing",
    title: "Benchmark Testing",
    caption: "5K · Threshold · HYROX",
    screenId: "performance-testing",
    mobileFloat: false,
    desktopClass: "bottom-[10%] right-0 w-[108px] lg:w-[118px]",
    mobileClass: "bottom-[4%] right-[4%] w-[96px]",
  },
];

export const HERO_ECOSYSTEM_PHONE = {
  screenId: "team-athlete-overview" as const,
  displayWidth: { mobile: 132, tablet: 210, desktop: 220 },
} as const;

/** Mini UI preview width inside floating cards */
export const HERO_MINI_UI_WIDTH = 52;
