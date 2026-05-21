import type { Metadata } from "next";
import { fetchAthleteOnboardingProgress } from "@/app/lib/hyroxAthleteOnboardingServer";
import { resolveCurrentHyroxAthlete } from "@/app/lib/hyroxCurrentAthlete";
import { createClient } from "@/app/lib/supabase/server";
import OnboardingStatusClient from "./OnboardingStatusClient";

export const metadata: Metadata = {
  title: "Onboarding | Hyrox Team Athlete",
  description: "Track your Hybrid365 Hyrox Team athlete onboarding progress.",
};

export default async function AthleteOnboardingPage() {
  const supabase = await createClient();
  const { athlete } = await resolveCurrentHyroxAthlete(supabase);

  const progress = athlete ? await fetchAthleteOnboardingProgress(athlete) : null;

  return (
    <OnboardingStatusClient
      athleteName={athlete?.name ?? null}
      initialProgress={progress}
    />
  );
}
