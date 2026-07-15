/** Homepage coaching track selector — pathways, not pricing. */

import { SECONDARY_LINKS } from "@/app/lib/homepage/homepageLinks";

export const TRACK_SELECTOR_COPY = {
  eyebrow: "Pathways",
  headline: "Choose your track.",
  body: "Coaching built around your goal — not one generic programme.",
} as const;

export type HomepageTrackId =
  | "hyrox-specific"
  | "strong-fit-fast"
  | "run-performance"
  | "personalised";

export type HomepageTrack = {
  id: HomepageTrackId;
  number: string;
  title: string;
  /** Optional multi-line emphasis lines under the title */
  points?: string[];
  description: string;
  ctaLabel: string;
  href: string;
};

export const HOMEPAGE_TRACKS: HomepageTrack[] = [
  {
    id: "hyrox-specific",
    number: "01",
    title: "HYROX Specific",
    description:
      "For athletes whose goal is racing faster, improving running, building station efficiency and chasing PBs.",
    ctaLabel: "Explore HYROX",
    href: SECONDARY_LINKS.hyroxCommunity,
  },
  {
    id: "strong-fit-fast",
    number: "02",
    title: "Strong. Fit. Fast.",
    points: ["Build muscle.", "Improve endurance.", "Look athletic."],
    description:
      "The complete hybrid athlete. Perfect for people who don't race HYROX but want elite fitness.",
    ctaLabel: "Explore Hybrid",
    href: SECONDARY_LINKS.paidCommunity,
  },
  {
    id: "run-performance",
    number: "03",
    title: "Run Performance",
    description:
      "Whether your goal is a faster 5K, 10K or Half Marathon. Structured running with strength work that actually supports your running.",
    ctaLabel: "Explore Running",
    href: "/free-week",
  },
  {
    id: "personalised",
    number: "04",
    title: "Personalised Coaching",
    description:
      "Need accountability? Programming adjusted around your life, goals and feedback every week. Closest thing to having a coach in your pocket.",
    ctaLabel: "Apply",
    href: "/one-to-one-coaching",
  },
];
