/** Homepage hero ecosystem — 5 orbital mini UI cards around central phone. */

import type { PhoneScreenId } from "./phoneScreens";

export type EcosystemMiniCard = {
  id: string;
  title: string;
  screenId: PhoneScreenId;
  /** Absolute position within ecosystem container */
  desktopClass: string;
  mobileClass: string;
  /** SVG connector (viewBox 0 0 100 100) — phone hub at ~50,50 */
  connectorPath: string;
  connectorEnd: { x: number; y: number };
};

export const HERO_ECOSYSTEM_MINI_CARDS: EcosystemMiniCard[] = [
  {
    id: "weekly-programme",
    title: "Weekly Programme",
    screenId: "programme",
    desktopClass: "left-1/2 top-[-10%] z-10 -translate-x-1/2",
    mobileClass: "left-1/2 top-[-12%] z-10 -translate-x-1/2",
    connectorPath: "M50 50 Q50 32 50 8",
    connectorEnd: { x: 50, y: 8 },
  },
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    screenId: "weekly-check-in",
    desktopClass: "left-[-6%] top-[10%] z-10",
    mobileClass: "left-[-4%] top-[8%] z-10",
    connectorPath: "M50 50 Q26 38 10 24",
    connectorEnd: { x: 10, y: 24 },
  },
  {
    id: "today-session",
    title: "Today's Session",
    screenId: "threshold-run",
    desktopClass: "right-[-6%] top-[10%] z-10",
    mobileClass: "right-[-4%] top-[8%] z-10",
    connectorPath: "M50 50 Q74 38 90 24",
    connectorEnd: { x: 90, y: 24 },
  },
  {
    id: "performance-testing",
    title: "Performance Testing",
    screenId: "performance-testing",
    desktopClass: "bottom-[-2%] left-[-6%] z-10",
    mobileClass: "bottom-[-1%] left-[-4%] z-10",
    connectorPath: "M50 50 Q26 62 10 80",
    connectorEnd: { x: 10, y: 80 },
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    screenId: "progress-overview",
    desktopClass: "bottom-[-2%] right-[-6%] z-10",
    mobileClass: "bottom-[-1%] right-[-4%] z-10",
    connectorPath: "M50 50 Q74 62 90 80",
    connectorEnd: { x: 90, y: 80 },
  },
];

export const HERO_ECOSYSTEM_PHONE = {
  screenId: "team-athlete-overview" as const,
  displayWidth: { mobile: 132, tablet: 188, desktop: 198 },
} as const;

/** Mini phone cutout width — bare transparent PNG, no preview frame */
export const HERO_MINI_UI_WIDTH = 52;
