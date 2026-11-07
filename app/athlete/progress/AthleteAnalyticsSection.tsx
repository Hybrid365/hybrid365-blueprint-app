"use client";

import type { HyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { ProgressExperience } from "@/components/athlete-command-centre/progress/ProgressExperience";

/** Athlete Progress analytics surface — improvement-first, real payload only. */
export function AthleteAnalyticsSection({ analytics }: { analytics: HyroxAthleteAnalytics }) {
  return <ProgressExperience analytics={analytics} />;
}
