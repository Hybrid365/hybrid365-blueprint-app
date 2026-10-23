import type { Metadata } from "next";
import { resolveAthletePortalPageAuth } from "@/app/lib/hyroxAthletePortalSnapshot";
import { getHyroxAthleteAnalytics } from "@/app/lib/hyroxAthleteAnalytics";
import { isHyroxAthleteAnalyticsEnabled } from "@/app/lib/hyroxAthleteAnalyticsFlag";
import { createAthleteServerSupabase } from "@/app/lib/supabase/athleteServerClient";
import ProgressPageClient from "./ProgressPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Progress | Hyrox Team Athlete",
};

export default async function AthleteProgressPage() {
  const portalAuth = await resolveAthletePortalPageAuth("/athlete/progress");
  const athlete = portalAuth.athlete;
  const analyticsEnabled = isHyroxAthleteAnalyticsEnabled({
    id: athlete?.id,
    email: athlete?.email ?? portalAuth.email,
  });

  let analytics = null;
  let analyticsError: string | null = null;

  if (analyticsEnabled && athlete) {
    try {
      const supabase = await createAthleteServerSupabase();
      analytics = await getHyroxAthleteAnalytics(supabase, athlete.id);
    } catch {
      analyticsError = "Could not load training analytics from stored sessions.";
    }
  }

  return (
    <ProgressPageClient
      analyticsEnabled={analyticsEnabled}
      analytics={analytics}
      analyticsError={analyticsError}
    />
  );
}
