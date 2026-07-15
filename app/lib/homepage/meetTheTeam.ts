/** Meet the Team — founder-first, then Hybrid365 athletes. */

import { FOUNDER_STORY_IMAGE } from "@/app/lib/homepage/founderStats";

export const MEET_THE_TEAM_COPY = {
  eyebrow: "Meet the team",
  headline: ["Real athletes.", "Real standards."],
  body: "Coached individually. Held to the same standard.\nThis is Hybrid365.",
  intakeLine: "Join the next Hybrid365 intake.",
  applyLabel: "Apply For Coaching",
} as const;

export type MeetTeamMember = {
  id: string;
  name: string;
  roleLabel: string;
  photoSrc: string;
  photoAlt: string;
  hoverSrc?: string;
  hoverAlt?: string;
  metrics: { label: string; value: string }[];
  tag: string;
  featured?: boolean;
};

export const MEET_THE_TEAM_MEMBERS: MeetTeamMember[] = [
  {
    id: "kieran-higgs",
    name: "Kieran Higgs",
    roleLabel: "Founder · Hybrid365",
    photoSrc: FOUNDER_STORY_IMAGE.src,
    photoAlt: FOUNDER_STORY_IMAGE.alt,
    metrics: [
      { label: "Pro HYROX", value: "59:14" },
      { label: "5K", value: "16:00" },
    ],
    tag: "Founder",
    featured: true,
  },
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    roleLabel: "HYROX Team Athlete",
    photoSrc: "/images/homepage/team/ben-kelly-announcement.png",
    photoAlt: "Ben Kelly — Hybrid365 HYROX Team",
    hoverSrc: "/images/homepage/team/ben-kelly-training.png",
    hoverAlt: "Ben Kelly training — Hybrid365",
    metrics: [
      { label: "5K", value: "16:16" },
      { label: "HYROX", value: "1:03 Pro Doubles" },
    ],
    tag: "Efficiency",
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    roleLabel: "HYROX Team Athlete",
    photoSrc: "/images/homepage/team/ricci-lee-jarvis-announcement.png",
    photoAlt: "Ricci-Lee Jarvis — Hybrid365 HYROX Team",
    hoverSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    hoverAlt: "Ricci-Lee Jarvis training — Hybrid365",
    metrics: [{ label: "5K", value: "18:45" }],
    tag: "Strength + Load",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    roleLabel: "HYROX Team Athlete",
    photoSrc: "/images/homepage/team/rae-wall-announcement.png",
    photoAlt: "Rae Wall — Hybrid365 HYROX Team",
    hoverSrc: "/images/homepage/team/rae-wall-training.png",
    hoverAlt: "Rae Wall training — Hybrid365",
    metrics: [{ label: "5K", value: "24:30" }],
    tag: "Body Composition",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    roleLabel: "HYROX Team Athlete",
    photoSrc: "/images/homepage/team/bobby-harrison-announcement.png",
    photoAlt: "Bobby Harrison — Hybrid365 HYROX Team",
    hoverSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    hoverAlt: "Bobby Harrison competing — Hybrid365",
    metrics: [{ label: "HYROX", value: "1:04" }],
    tag: "Strength + Running",
  },
];
