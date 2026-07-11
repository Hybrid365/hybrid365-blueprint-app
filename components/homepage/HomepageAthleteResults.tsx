import { ATHLETE_RESULTS } from "@/app/lib/homepage/athleteResults";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { AthleteResultCard } from "./AthleteResultCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

export function HomepageAthleteResults() {
  return (
    <HomepageSection id="results" variant="dark">
      <HomepageEyebrow>Proof</HomepageEyebrow>
      <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
        Athlete results
      </HomepageHeading>
      <p className="mt-5 max-w-xl text-base text-white/55">
        Structured coaching. Measurable progress. Real HYROX athletes moving
        faster — not guessing week to week.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ATHLETE_RESULTS.map((athlete) => (
          <AthleteResultCard key={athlete.id} athlete={athlete} />
        ))}
      </div>

      <p className="mt-8 text-xs text-white/35">
        * Placeholder cards — replace with verified athlete data in{" "}
        <code className="text-white/50">app/lib/homepage/athleteResults.ts</code>
      </p>

      <div className="mt-8">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Build My Free Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
