import type { Metadata } from "next";
import AssessmentFormShell from "./AssessmentFormShell";

export const metadata: Metadata = {
  title: "Assessment | Hyrox Team Athlete",
  description: "Complete your Hybrid365 Hyrox Team athlete assessment.",
};

export default function AthleteAssessmentPage() {
  return <AssessmentFormShell />;
}
