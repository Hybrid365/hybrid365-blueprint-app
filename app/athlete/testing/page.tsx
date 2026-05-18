import type { Metadata } from "next";
import TestingPageClient from "./TestingPageClient";

export const metadata: Metadata = {
  title: "Baseline Testing | Hyrox Team Athlete",
  description: "Submit your Hyrox Team baseline test results.",
};

export default function AthleteTestingPage() {
  return <TestingPageClient />;
}
