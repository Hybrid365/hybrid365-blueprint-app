import type { Metadata } from "next";
import RacePrepPageClient from "./RacePrepPageClient";

export const metadata: Metadata = {
  title: "Race Prep | Hyrox Team Athlete",
};

export default function AthleteRacePrepPage() {
  return <RacePrepPageClient />;
}
