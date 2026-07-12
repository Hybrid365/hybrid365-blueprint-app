/**
 * Hero illustration — fixed Figma spec (desktop + mobile artboards).
 * All positions and connector paths are hard-coded. Never computed at runtime.
 */

import type { PhoneScreenId } from "./phoneScreens";

export type ArtboardPoint = { x: number; y: number };

export type HeroFeatureMetric = {
  label: string;
  value: string;
};

export type HeroFeatureCardSpec = {
  id: string;
  title: string;
  screenId: PhoneScreenId;
  metrics: HeroFeatureMetric[];
  /** Top-left corner of card block (title + body) on artboard */
  position: ArtboardPoint;
};

export type HeroIllustrationConnector = {
  id: string;
  path: string;
  phoneAnchor: ArtboardPoint;
  cardAnchor: ArtboardPoint;
};

export type HeroIllustrationSpec = {
  width: number;
  height: number;
  phone: { center: ArtboardPoint; width: number };
  cards: HeroFeatureCardSpec[];
  connectors: HeroIllustrationConnector[];
};

const PHONE_ASPECT = 999 / 440;

/** Shared card body — equal on all four cards */
export const HERO_FEATURE_CARD = {
  width: 124,
  bodyHeight: 68,
  titleHeight: 14,
} as const;

const FEATURE_CARD_CONTENT: Omit<HeroFeatureCardSpec, "position">[] = [
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    screenId: "weekly-check-in",
    metrics: [
      { label: "Sleep", value: "8/10" },
      { label: "Energy", value: "9/10" },
      { label: "Soreness", value: "4/10" },
      { label: "Bodyweight", value: "78.2kg" },
    ],
  },
  {
    id: "today-session",
    title: "Today's Session",
    screenId: "threshold-run",
    metrics: [
      { label: "Threshold Run", value: "" },
      { label: "45 min", value: "" },
      { label: "RPE 7–8", value: "" },
      { label: "Coach notes included", value: "" },
    ],
  },
  {
    id: "benchmark-testing",
    title: "Benchmark Testing",
    screenId: "performance-testing",
    metrics: [
      { label: "5K", value: "16:00" },
      { label: "Threshold", value: "48 min" },
      { label: "HYROX", value: "Complete" },
      { label: "Strength", value: "Up to date" },
    ],
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    screenId: "progress-overview",
    metrics: [
      { label: "Run Volume", value: "+35%" },
      { label: "Threshold Time", value: "+100%" },
      { label: "Race Readiness", value: "82%" },
    ],
  },
];

/** Desktop — quadrant layout matching reference */
export const HERO_ILLUSTRATION_DESKTOP: HeroIllustrationSpec = {
  width: 440,
  height: 500,
  phone: { center: { x: 226, y: 248 }, width: 150 },
  cards: [
    { ...FEATURE_CARD_CONTENT[0], position: { x: 10, y: 46 } },
    { ...FEATURE_CARD_CONTENT[1], position: { x: 306, y: 46 } },
    { ...FEATURE_CARD_CONTENT[2], position: { x: 10, y: 386 } },
    { ...FEATURE_CARD_CONTENT[3], position: { x: 306, y: 386 } },
  ],
  connectors: [
    {
      id: "weekly-check-in",
      path: "M134 108 C158 102, 142 128, 151 136",
      phoneAnchor: { x: 151, y: 136 },
      cardAnchor: { x: 134, y: 108 },
    },
    {
      id: "today-session",
      path: "M306 108 C282 102, 298 128, 301 136",
      phoneAnchor: { x: 301, y: 136 },
      cardAnchor: { x: 306, y: 108 },
    },
    {
      id: "benchmark-testing",
      path: "M134 420 C158 426, 142 352, 151 344",
      phoneAnchor: { x: 151, y: 344 },
      cardAnchor: { x: 134, y: 420 },
    },
    {
      id: "progress-tracking",
      path: "M306 420 C282 426, 298 352, 301 344",
      phoneAnchor: { x: 301, y: 344 },
      cardAnchor: { x: 306, y: 420 },
    },
  ],
};

/** Mobile — compact quadrant, same composition */
export const HERO_ILLUSTRATION_MOBILE: HeroIllustrationSpec = {
  width: 300,
  height: 340,
  phone: { center: { x: 150, y: 168 }, width: 108 },
  cards: [
    { ...FEATURE_CARD_CONTENT[0], position: { x: 4, y: 28 } },
    { ...FEATURE_CARD_CONTENT[1], position: { x: 208, y: 28 } },
    { ...FEATURE_CARD_CONTENT[2], position: { x: 4, y: 262 } },
    { ...FEATURE_CARD_CONTENT[3], position: { x: 208, y: 262 } },
  ],
  connectors: [
    {
      id: "weekly-check-in",
      path: "M92 72 C104 68, 98 86, 100 92",
      phoneAnchor: { x: 100, y: 92 },
      cardAnchor: { x: 92, y: 72 },
    },
    {
      id: "today-session",
      path: "M208 72 C196 68, 202 86, 204 92",
      phoneAnchor: { x: 204, y: 92 },
      cardAnchor: { x: 208, y: 72 },
    },
    {
      id: "benchmark-testing",
      path: "M92 284 C104 288, 98 246, 100 240",
      phoneAnchor: { x: 100, y: 240 },
      cardAnchor: { x: 92, y: 284 },
    },
    {
      id: "progress-tracking",
      path: "M208 284 C196 288, 202 246, 204 240",
      phoneAnchor: { x: 204, y: 240 },
      cardAnchor: { x: 208, y: 284 },
    },
  ],
};

export const HERO_ILLUSTRATION_PHONE = {
  screenId: "team-athlete-overview" as const,
} as const;

export function artboardToPercent(
  point: ArtboardPoint,
  size: { width: number; height: number }
) {
  return {
    left: `${(point.x / size.width) * 100}%`,
    top: `${(point.y / size.height) * 100}%`,
  };
}

export function artboardWidthPercent(px: number, artboardWidth: number) {
  return `${(px / artboardWidth) * 100}%`;
}

export function phoneHeightPx(phoneWidth: number) {
  return phoneWidth * PHONE_ASPECT;
}
