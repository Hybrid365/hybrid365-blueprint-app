/** Central links for the Hybrid365 marketing homepage — update here only. */

/** Primary funnel CTA — free-week builder (HYROX track + existing challenge mode). */
export const FREE_WEEK_HYROX_URL = "/free-week?track=hyrox&challenge=hyrox";

/** Warm visitors choose HYROX Track vs 1-1. */
export const COACHING_START_URL = "/start";

/** Unsure visitors — Talk to Kieran enquiry. */
export const TALK_TO_KIERAN_URL = "/start/talk";

export const HOMEPAGE_NAV = {
  team: "#athletes",
  tracks: "#coaching",
  system: "#system",
  screening: "#system",
  telegram: "#team",
  quotes: "#results",
  faq: "#faq",
  start: "#start",
  freeWeek: "#start",
  howItWorks: "#system",
  accountability: "#system",
  athletes: "#athletes",
  results: "#results",
  identity: "#athletes",
  method: "#system",
  standard: "#team",
  community: "#team",
  product: "#product",
  coaching: "#coaching",
  login: "/login",
} as const;

export const INSTAGRAM_URL = "https://www.instagram.com/hybrid.365";

/** Secondary paths — visually subdued; never compete with primary CTA. */
export const SECONDARY_LINKS = {
  hyroxCommunity: "/hyrox-community",
  paidCommunity: "/community",
  hyroxTeam: "/hyrox-team",
  hyroxTeamApply: "/hyrox-team/apply",
  telegram: process.env.NEXT_PUBLIC_FREE_WEEK_TELEGRAM_URL?.trim() ||
    process.env.NEXT_PUBLIC_HYBRID75_TELEGRAM_URL?.trim() ||
    "https://t.me/+0WAGU5S9BrQxYzQ0",
} as const;
