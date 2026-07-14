/** Hybrid365 Team showcase — homepage athlete profiles. */

export const TEAM_SHOWCASE_COPY = {
  eyebrow: "The team",
  headline: ["Built by athletes.", "Driven by standards."],
  body: "The full Hybrid365 roster — coached individually, held to the same standard.",
  intakeLine: "Join the next Hybrid365 intake.",
  applyLabel: "Apply For Coaching",
} as const;

export type TeamShowcaseAthlete = {
  id: string;
  name: string;
  roleLabel: "HYROX Team Athlete";
  tag: string;
  announcementSrc: string;
  announcementAlt: string;
  hoverSrc?: string;
  hoverAlt?: string;
};

export const TEAM_SHOWCASE_ATHLETES: TeamShowcaseAthlete[] = [
  {
    id: "ben-kelly",
    name: "Ben Kelly",
    roleLabel: "HYROX Team Athlete",
    tag: "Strength Builder",
    announcementSrc: "/images/homepage/team/ben-kelly-announcement.png",
    announcementAlt: "Ben Kelly — Hybrid365 HYROX Team signing announcement",
    hoverSrc: "/images/homepage/team/ben-kelly-training.png",
    hoverAlt: "Ben Kelly training — Hybrid365 HYROX Team athlete",
  },
  {
    id: "ricci-lee-jarvis",
    name: "Ricci-Lee Jarvis",
    roleLabel: "HYROX Team Athlete",
    tag: "Strength Builder",
    announcementSrc: "/images/homepage/team/ricci-lee-jarvis-announcement.png",
    announcementAlt: "Ricci-Lee Jarvis — Hybrid365 HYROX Team signing announcement",
    hoverSrc: "/images/homepage/team/ricci-lee-jarvis-training.png",
    hoverAlt: "Ricci-Lee Jarvis training — Hybrid365 HYROX Team athlete",
  },
  {
    id: "rae-wall",
    name: "Rae Wall",
    roleLabel: "HYROX Team Athlete",
    tag: "Fat Loss",
    announcementSrc: "/images/homepage/team/rae-wall-announcement.png",
    announcementAlt: "Rae Wall — Hybrid365 HYROX Team signing announcement",
    hoverSrc: "/images/homepage/team/rae-wall-training.png",
    hoverAlt: "Rae Wall training — Hybrid365 HYROX Team athlete",
  },
  {
    id: "bobby-harrison",
    name: "Bobby Harrison",
    roleLabel: "HYROX Team Athlete",
    tag: "Endurance",
    announcementSrc: "/images/homepage/team/bobby-harrison-announcement.png",
    announcementAlt: "Bobby Harrison — Hybrid365 HYROX Team signing announcement",
    hoverSrc: "/images/homepage/team/bobby-harrison-wall-ball.png",
    hoverAlt: "Bobby Harrison competing — Hybrid365 HYROX Team athlete",
  },
];
