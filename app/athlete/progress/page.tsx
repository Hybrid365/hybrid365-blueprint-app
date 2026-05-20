import type { Metadata } from "next";
import ProgressPageClient from "./ProgressPageClient";

export const metadata: Metadata = {
  title: "Progress | Hyrox Team Athlete",
};

export default function AthleteProgressPage() {
  return <ProgressPageClient />;
}
