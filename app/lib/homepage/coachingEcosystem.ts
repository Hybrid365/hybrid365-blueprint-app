/** Homepage hero ecosystem — 5 orbital mini UI cards around central phone. */

import type { PhoneScreenId } from "./phoneScreens";

export type EcosystemMiniCard = {
  id: string;
  title: string;
  screenId: PhoneScreenId;
  /** Absolute position within ecosystem container */
  desktopClass: string;
  mobileClass: string;
  /** SVG connector (viewBox 0 0 100 100) — phone hub at ~50,46 */
  connectorPath: string;
  connectorEnd: { x: number; y: number };
};

export const HERO_ECOSYSTEM_MINI_CARDS: EcosystemMiniCard[] = [
  {
    id: "weekly-programme",
    title: "Weekly Programme",
    screenId: "programme",
    desktopClass: "left-1/2 top-0 z-20 w-[120px] -translate-x-1/2",
    mobileClass: "left-1/2 top-0 z-20 w-[88px] -translate-x-1/2",
    connectorPath: "M50 46 Q50 34 50 16",
    connectorEnd: { x: 50, y: 16 },
  },
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    screenId: "weekly-check-in",
    desktopClass: "left-0 top-[16%] z-20 w-[118px]",
    mobileClass: "left-0 top-[12%] z-20 w-[86px]",
    connectorPath: "M50 46 Q32 38 18 26",
    connectorEnd: { x: 18, y: 26 },
  },
  {
    id: "today-session",
    title: "Today's Session",
    screenId: "threshold-run",
    desktopClass: "right-0 top-[16%] z-20 w-[118px]",
    mobileClass: "right-0 top-[12%] z-20 w-[86px]",
    connectorPath: "M50 46 Q68 38 82 26",
    connectorEnd: { x: 82, y: 26 },
  },
  {
    id: "performance-testing",
    title: "Performance Testing",
    screenId: "performance-testing",
    desktopClass: "bottom-0 left-0 z-20 w-[118px]",
    mobileClass: "bottom-[2%] left-0 z-20 w-[86px]",
    connectorPath: "M50 46 Q32 58 18 74",
    connectorEnd: { x: 18, y: 74 },
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    screenId: "progress-overview",
    desktopClass: "bottom-0 right-0 z-20 w-[118px]",
    mobileClass: "bottom-[2%] right-0 z-20 w-[86px]",
    connectorPath: "M50 46 Q68 58 82 74",
    connectorEnd: { x: 82, y: 74 },
  },
];

export const HERO_ECOSYSTEM_PHONE = {
  screenId: "team-athlete-overview" as const,
  displayWidth: { mobile: 148, tablet: 200, desktop: 210 },
} as const;

/** Mini UI preview width inside floating cards */
export const HERO_MINI_UI_WIDTH = 56;
