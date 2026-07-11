/** Homepage hero ecosystem — 4 quadrant UI cards around central phone. */

import type { PhoneScreenId } from "./phoneScreens";

export type EcosystemMiniCard = {
  id: string;
  title: string;
  screenId: PhoneScreenId;
  desktopClass: string;
  mobileClass: string;
  /** SVG connector (viewBox 0 0 100 100) — phone hub at ~50,48 */
  connectorPath: string;
  connectorEnd: { x: number; y: number };
};

export const HERO_ECOSYSTEM_MINI_CARDS: EcosystemMiniCard[] = [
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    screenId: "weekly-check-in",
    desktopClass: "left-[14%] top-[18%] z-[18]",
    mobileClass: "left-[8%] top-[16%] z-[18]",
    connectorPath: "M50 48 Q36 40 28 32",
    connectorEnd: { x: 28, y: 32 },
  },
  {
    id: "today-session",
    title: "Today's Session",
    screenId: "threshold-run",
    desktopClass: "right-[14%] top-[18%] z-[18]",
    mobileClass: "right-[8%] top-[16%] z-[18]",
    connectorPath: "M50 48 Q64 40 72 32",
    connectorEnd: { x: 72, y: 32 },
  },
  {
    id: "performance-testing",
    title: "Benchmark Testing",
    screenId: "performance-testing",
    desktopClass: "bottom-[18%] left-[14%] z-[18]",
    mobileClass: "bottom-[16%] left-[8%] z-[18]",
    connectorPath: "M50 48 Q36 56 28 66",
    connectorEnd: { x: 28, y: 66 },
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    screenId: "progress-overview",
    desktopClass: "bottom-[18%] right-[14%] z-[18]",
    mobileClass: "bottom-[16%] right-[8%] z-[18]",
    connectorPath: "M50 48 Q64 56 72 66",
    connectorEnd: { x: 72, y: 66 },
  },
];

export const HERO_ECOSYSTEM_PHONE = {
  screenId: "team-athlete-overview" as const,
  displayWidth: { mobile: 140, tablet: 196, desktop: 216 },
} as const;

/** UI snippet width inside compact floating cards */
export const HERO_MINI_UI_WIDTH = 108;
