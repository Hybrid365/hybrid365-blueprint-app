/**
 * Hero illustration artboard — fixed Figma-style composition.
 * All positions are absolute coordinates on a 520×680 canvas.
 * The layout never reflows; the whole illustration scales as one unit.
 */

import type { PhoneScreenId } from "./phoneScreens";

export const HERO_ILLUSTRATION_SIZE = { width: 520, height: 680 } as const;

export type ArtboardPoint = { x: number; y: number };

export type HeroIllustrationConnector = {
  id: string;
  /** Cubic / quadratic SVG path in artboard coordinates */
  path: string;
  phoneAnchor: ArtboardPoint;
  cardAnchor: ArtboardPoint;
};

export type HeroIllustrationCard = {
  id: string;
  title: string;
  screenId: PhoneScreenId;
  /** Card centre on artboard */
  center: ArtboardPoint;
  /** Card width on artboard (all cards equal) */
  width: number;
};

/** Phone centre sits slightly right of artboard centre */
export const HERO_ILLUSTRATION_PHONE = {
  screenId: "team-athlete-overview" as const,
  center: { x: 272, y: 328 },
  width: 186,
  aspect: 999 / 440,
} as const;

function phoneBounds() {
  const halfW = HERO_ILLUSTRATION_PHONE.width / 2;
  const halfH = (HERO_ILLUSTRATION_PHONE.width * HERO_ILLUSTRATION_PHONE.aspect) / 2;
  const { x, y } = HERO_ILLUSTRATION_PHONE.center;
  return {
    top: y - halfH,
    bottom: y + halfH,
    left: x - halfW,
    right: x + halfW,
    center: { x, y },
  };
}

/** Equal-weight teaser cards — cross layout around phone */
export const HERO_ILLUSTRATION_CARDS: HeroIllustrationCard[] = [
  {
    id: "weekly-check-in",
    title: "Weekly Check-In",
    screenId: "weekly-check-in",
    center: { x: 272, y: 42 },
    width: 86,
  },
  {
    id: "performance-testing",
    title: "Performance Testing",
    screenId: "performance-testing",
    center: { x: 48, y: 328 },
    width: 86,
  },
  {
    id: "today-session",
    title: "Today's Session",
    screenId: "threshold-run",
    center: { x: 496, y: 328 },
    width: 86,
  },
  {
    id: "progress-tracking",
    title: "Progress Tracking",
    screenId: "progress-overview",
    center: { x: 272, y: 632 },
    width: 86,
  },
];

const CARD_HALF_H = 38;

function cardEdgeTowardPhone(card: HeroIllustrationCard): ArtboardPoint {
  const phone = phoneBounds();
  const dx = phone.center.x - card.center.x;
  const dy = phone.center.y - card.center.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: card.center.x + (dx > 0 ? card.width / 2 : -card.width / 2),
      y: card.center.y,
    };
  }
  return {
    x: card.center.x,
    y: card.center.y + (dy > 0 ? CARD_HALF_H : -CARD_HALF_H),
  };
}

function phoneEdgeTowardCard(card: HeroIllustrationCard): ArtboardPoint {
  const phone = phoneBounds();
  const dx = card.center.x - phone.center.x;
  const dy = card.center.y - phone.center.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return {
      x: dx > 0 ? phone.right : phone.left,
      y: phone.center.y,
    };
  }
  return {
    x: phone.center.x,
    y: dy > 0 ? phone.bottom : phone.top,
  };
}

function connectorPath(from: ArtboardPoint, to: ArtboardPoint): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const bow = 10;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cx = Math.abs(dx) > Math.abs(dy) ? mx : mx + (dx >= 0 ? bow : -bow);
  const cy = Math.abs(dx) > Math.abs(dy) ? my + bow : my;
  return `M${from.x} ${from.y} Q${cx} ${cy} ${to.x} ${to.y}`;
}

export const HERO_ILLUSTRATION_CONNECTORS: HeroIllustrationConnector[] =
  HERO_ILLUSTRATION_CARDS.map((card) => {
    const from = phoneEdgeTowardCard(card);
    const to = cardEdgeTowardPhone(card);
    return {
      id: card.id,
      path: connectorPath(from, to),
      phoneAnchor: from,
      cardAnchor: to,
    };
  });

/** Convert artboard coordinate to CSS percentage */
export function artboardToPercent(point: ArtboardPoint) {
  return {
    left: `${(point.x / HERO_ILLUSTRATION_SIZE.width) * 100}%`,
    top: `${(point.y / HERO_ILLUSTRATION_SIZE.height) * 100}%`,
  };
}

export function artboardWidthPercent(px: number) {
  return `${(px / HERO_ILLUSTRATION_SIZE.width) * 100}%`;
}
