import type { Metadata } from "next";
import BenchmarksPageClient from "./BenchmarksPageClient";

export const metadata: Metadata = {
  title: "Benchmarks | Hyrox Team Athlete",
};

export default function AthleteBenchmarksPage() {
  return <BenchmarksPageClient />;
}
