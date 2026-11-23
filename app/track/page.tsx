import { notFound } from "next/navigation";
import TrackAthleteApp from "@/components/track/TrackAthleteApp";
import TrackJourneyHome from "@/components/track/TrackJourneyHome";
import TrackJourneySetup from "@/components/track/TrackJourneySetup";
import { loadCanary } from "@/app/lib/track-canary/model";
import { createClient } from "@/app/lib/supabase/server";
import { productionCalendarDate } from "@/app/lib/track-production/clock";
import { PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID } from "@/app/lib/track-production/access";
import { CORE_JOURNEY_STEPS, journeyResumeStep } from "@/app/lib/track-production/journeyContinue";
import { accessReady } from "@/app/lib/track-production/journeyProduct";
import { readJourneyMorning, readJourneySetup, saveJourneyIntake } from "@/app/lib/track-production/journeyAccess";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function TrackPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.id === PRODUCTION_TRACK_JOURNEY_AUTH_USER_ID) {
    const setup = await readJourneySetup();
    if (!setup) notFound();
    const asOf = productionCalendarDate();
    const ready = accessReady(setup.intake);
    const resume = journeyResumeStep({ step: setup.step, steps: CORE_JOURNEY_STEPS, accessReady: ready });
    if (resume.step !== setup.step) {
      try {
        await saveJourneyIntake(setup.intake, resume.step);
      } catch (error) {
        console.error("[track journey] resume correction failed", {
          step: setup.step,
          requested: resume.step,
          resolved: resume.step,
          persisted: setup.step,
          reason: error instanceof Error ? error.message : "unknown",
        });
      }
    }
    if (ready) {
      const morning = await readJourneyMorning(asOf);
      return <TrackJourneyHome intake={setup.intake} results={setup.results} asOf={asOf} morning={morning} />;
    }
    return <TrackJourneySetup intake={setup.intake} step={resume.step} results={setup.results} asOf={asOf} />;
  }
  const view = await loadCanary();
  return <TrackAthleteApp view={view} />;
}
