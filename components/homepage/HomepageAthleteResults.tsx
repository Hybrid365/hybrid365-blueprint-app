import { PROOF_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { ATHLETE_RESULTS } from "@/app/lib/homepage/athleteResults";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { AthleteResultCard } from "./AthleteResultCard";
import { HomepagePhoneCarousel } from "./HomepagePhoneCarousel";
import {
  HomepageSection,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageAthleteResults() {
  return (
    <HomepageSection id="athlete-progress" variant="dark" className="overflow-hidden">
      <HomepagePhoneCarousel
        items={PROOF_PHONE_SCREENS}
        phoneSize="md"
      />

      <div className="mt-16">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/40 lg:text-left">
          Athlete progress
        </p>
        <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0">
          {ATHLETE_RESULTS.map((athlete) => (
            <div key={athlete.id} className="w-[min(88vw,340px)] shrink-0 snap-start lg:w-auto">
              <AthleteResultCard athlete={athlete} />
            </div>
          ))}
        </div>
      </div>

      <HomepageCtaRow>
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
