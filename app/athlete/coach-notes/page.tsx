import type { Metadata } from "next";
import CoachNotesPageClient from "./CoachNotesPageClient";

export const metadata: Metadata = {
  title: "Coach Notes | Hyrox Team Athlete",
};

export default function AthleteCoachNotesPage() {
  return <CoachNotesPageClient />;
}
