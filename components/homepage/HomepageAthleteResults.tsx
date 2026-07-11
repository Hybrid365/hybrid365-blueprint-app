import { ATHLETE_RESULTS } from "@/app/lib/homepage/athleteResults";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { AthleteResultCard } from "./AthleteResultCard";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageAthleteResults() {
  return (
    <HomepageSection id="results" variant="dark">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>Proof</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          Results that compound
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          When effort meets structure, progress shows up — on the clock, in the gym
          and on race day. HYROX results are a major proof point.
        </p>
      </div>

      <div className="mt-12 -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
        {ATHLETE_RESULTS.map((athlete) => (
          <div key={athlete.id} className="w-[min(88vw,340px)] shrink-0 snap-start lg:w-auto">
            <AthleteResultCard athlete={athlete} />
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-white/35 lg:text-left">
        * Placeholder cards — replace with verified athlete data in{" "}
        <code className="text-white/50">app/lib/homepage/athleteResults.ts</code>
      </p>

      <HomepageCtaRow>
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
