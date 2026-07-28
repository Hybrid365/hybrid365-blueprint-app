import type { Metadata } from "next";
import BoxCrossSkiChallengeClient from "./BoxCrossSkiChallengeClient";
import {
  BOXCROSS_LOGO_PLACEHOLDER_PATH,
  BOXCROSS_OG_PLACEHOLDER_PATH,
} from "@/app/lib/boxcross/types";

const TITLE = "BoxCross 1KM Ski Challenge | Live Leaderboard";
const DESCRIPTION =
  "Take on the BoxCross 1KM Ski Challenge. Set your fastest SkiErg time, track the live leaderboard and compete for £100 Bulk Nutrition prizes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [{ url: BOXCROSS_OG_PLACEHOLDER_PATH, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [BOXCROSS_OG_PLACEHOLDER_PATH],
  },
  icons: {
    icon: BOXCROSS_LOGO_PLACEHOLDER_PATH,
  },
};

export default function BoxCrossSkiChallengePage() {
  return <BoxCrossSkiChallengeClient />;
}
