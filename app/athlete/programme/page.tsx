import type { Metadata } from "next";
import ProgrammePageClient from "./ProgrammePageClient";

export const metadata: Metadata = {
  title: "Programme | Hyrox Team Athlete",
  description: "Your weekly Hybrid365 Hyrox training programme.",
};

export default function AthleteProgrammePage() {
  return <ProgrammePageClient />;
}
