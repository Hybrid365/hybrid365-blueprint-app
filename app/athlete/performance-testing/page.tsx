import type { Metadata } from "next";
import PerformanceTestingPageClient from "./PerformanceTestingPageClient";

export const metadata: Metadata = {
  title: "Performance Testing | Hyrox Team Athlete",
  description: "Hybrid365 Performance Testing — structured test week for HYROX Team athletes.",
};

export default function AthletePerformanceTestingPage() {
  return <PerformanceTestingPageClient />;
}
