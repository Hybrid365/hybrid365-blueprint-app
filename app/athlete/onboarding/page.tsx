import type { Metadata } from "next";
import OnboardingStatusClient from "./OnboardingStatusClient";

export const metadata: Metadata = {
  title: "Onboarding | Hyrox Team Athlete",
  description: "Track your Hybrid365 Hyrox Team athlete onboarding progress.",
};

export default function AthleteOnboardingPage() {
  return <OnboardingStatusClient />;
}
