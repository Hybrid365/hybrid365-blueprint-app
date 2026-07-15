/** Accountability, challenges and team standards — homepage storytelling. */

export const ACCOUNTABILITY_COPY = {
  eyebrow: "More than a programme",
  headline: "Accountability built in.",
  body: "Structure works best when there is a reason to show up — and people around you who expect the same standard.",
  statement: ["Coached individually.", "Held to a team standard."],
  note: "Same standard. Different programmes.",
} as const;

export type AccountabilityArea = {
  id: string;
  title: string;
  items: string[];
};

export const ACCOUNTABILITY_AREAS: AccountabilityArea[] = [
  {
    id: "daily",
    title: "Daily Accountability",
    items: [
      "Session completion",
      "Training notes",
      "Proof where relevant",
      "Coach visibility",
      "Clear next action",
    ],
  },
  {
    id: "challenges",
    title: "Weekly Challenges",
    items: [
      "Performance challenges",
      "Consistency challenges",
      "Community participation",
      "Opportunities to test progress",
    ],
  },
  {
    id: "leaderboards",
    title: "Leaderboards",
    items: [
      "Session completion",
      "Challenge scores",
      "Progress recognition",
      "Competitive motivation without losing individual focus",
    ],
  },
  {
    id: "team",
    title: "Team Standard",
    items: [
      "Athletes with different goals",
      "Shared commitment",
      "Refuse Average identity",
      "Visible community",
    ],
  },
];
