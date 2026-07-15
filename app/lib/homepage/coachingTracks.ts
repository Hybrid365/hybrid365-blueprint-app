/** Homepage coaching track selector — product paths, not philosophy. */

import {
  FREE_WEEK_HYROX_URL,
  SECONDARY_LINKS,
} from "@/app/lib/homepage/homepageLinks";

export const TRACK_SELECTOR_COPY = {
  eyebrow: "Coaching",
  headline: "Choose your track.",
  body: "One coaching standard.\nDifferent journeys.\nChoose the path that matches your goals.",
} as const;

export type HomepageTrackId =
  | "hyrox-team"
  | "hybrid-performance"
  | "community"
  | "one-to-one";

export type HomepageTrack = {
  id: HomepageTrackId;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  accent: string;
};

export const HOMEPAGE_TRACKS: HomepageTrack[] = [
  {
    id: "hyrox-team",
    title: "HYROX Team",
    description:
      "Selective 1-1 coaching inside a high-performance team — tested, programmed and race-ready.",
    ctaLabel: "Explore HYROX Team",
    href: SECONDARY_LINKS.hyroxTeam,
    accent: "Team",
  },
  {
    id: "hybrid-performance",
    title: "Hybrid Performance",
    description:
      "Structured hybrid programming for athletes who want to look athletic, lift heavy and race with intent.",
    ctaLabel: "Start free week",
    href: FREE_WEEK_HYROX_URL,
    accent: "Structure",
  },
  {
    id: "community",
    title: "Community",
    description:
      "Full membership access — programme, dashboard, check-ins and a community built on standards.",
    ctaLabel: "Join community",
    href: SECONDARY_LINKS.paidCommunity,
    accent: "Membership",
  },
  {
    id: "one-to-one",
    title: "1-1 Coaching",
    description:
      "Personalised coaching for physique, strength and hybrid performance — built around your life.",
    ctaLabel: "Apply for 1-1",
    href: "/one-to-one-coaching",
    accent: "Personal",
  },
];
