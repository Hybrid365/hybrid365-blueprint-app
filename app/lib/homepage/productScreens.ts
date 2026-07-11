/** Labels for homepage product / UI showcase screens. */

export type ProductScreen = {
  id: string;
  title: string;
  description: string;
};

export const PRODUCT_SCREENS: ProductScreen[] = [
  {
    id: "today",
    title: "Today's session",
    description: "Know exactly what to train, when, and at what intensity.",
  },
  {
    id: "weekly",
    title: "Weekly plan",
    description: "Structured hybrid sessions sequenced for progression.",
  },
  {
    id: "progress",
    title: "Progress dashboard",
    description: "Track completion, benchmarks and race readiness.",
  },
  {
    id: "checkin",
    title: "Weekly check-in",
    description: "Accountability built in — coach feedback on your block.",
  },
  {
    id: "benchmark",
    title: "Benchmarks",
    description: "Running, strength and HYROX markers in one place.",
  },
];
