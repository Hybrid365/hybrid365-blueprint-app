/** Central links for the Hybrid365 marketing homepage — update here only. */

/** Primary funnel CTA — free-week builder (HYROX track + existing challenge mode). */
export const FREE_WEEK_HYROX_URL = "/free-week?track=hyrox&challenge=hyrox";

export const HOMEPAGE_NAV = {
  team: "#team",
  tracks: "#tracks",
  system: "#system",
  screening: "#screening",
  telegram: "#telegram",
  quotes: "#quotes",
  faq: "#faq",
  start: "#start",
  freeWeek: "#start",
  howItWorks: "#screening",
  accountability: "#screening",
  /** @deprecated Kept for any residual anchors */
  athletes: "#team",
  results: "#team",
  identity: "#team",
  method: "#tracks",
  standard: "#team",
  community: "#telegram",
  login: "/login",
} as const;

export const INSTAGRAM_URL = "https://www.instagram.com/hybrid.365";

/** Secondary paths — visually subdued; never compete with primary CTA. */
export const SECONDARY_LINKS = {
  hyroxCommunity: "/hyrox-community",
  paidCommunity: "/community",
  hyroxTeam: "/hyrox-team",
  telegram: process.env.NEXT_PUBLIC_FREE_WEEK_TELEGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_HYBRID75_TELEGRAM_URL?.trim() ||
    "https://t.me/+0WAGU5S9BrQxYzQ0",
} as const;
