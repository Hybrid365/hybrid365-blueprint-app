import { notFound } from "next/navigation";
import TrackAthleteApp from "@/components/track/TrackAthleteApp";
import TrackJourneySetup from "@/components/track/TrackJourneySetup";
import { loadCanary } from "@/app/lib/track-canary/model";
import { createClient } from "@/app/lib/supabase/server";
import { productionCalendarDate } from "@/app/lib/track-production/clock";
import { PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID } from "@/app/lib/track-production/access";
import { readJourneySetup } from "@/app/lib/track-production/journeyAccess";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function TrackPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.id === PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID) {
    const setup = await readJourneySetup();
    if (!setup) notFound();
    return <TrackJourneySetup intake={setup.intake} step={setup.step} results={setup.results} asOf={productionCalendarDate()} />;
  }
  const view = await loadCanary();
  return <TrackAthleteApp view={view} />;
}
