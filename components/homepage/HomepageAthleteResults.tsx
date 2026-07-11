import { RESULTS_BODY, RESULTS_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { ATHLETE_EDITORIAL_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { ATHLETE_RESULTS } from "@/app/lib/homepage/athleteResults";
import { PROOF_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { AthleteResultCard } from "./AthleteResultCard";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import { HomepagePhoneCarousel } from "./HomepagePhoneCarousel";
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
    <HomepageSection id="results" variant="dark" className="overflow-hidden">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-12">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>{RESULTS_HEADLINE.eyebrow}</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            {RESULTS_HEADLINE.line1}
            <span className="block text-[#f4d23c]">{RESULTS_HEADLINE.line2}</span>
          </HomepageHeading>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
            {RESULTS_BODY}
          </p>
        </div>

        {/* Results metrics overlaid on athlete effort */}
        <div className="relative mx-auto h-[200px] w-full max-w-lg sm:h-[240px] lg:mx-0 lg:max-w-none">
          <HomepageEditorialPhoto
            photo={ATHLETE_EDITORIAL_PHOTOS.gritProfile}
            className="absolute inset-0"
            intensity="default"
            sizes="(max-width: 1024px) 90vw, 45vw"
          />
          <div className="absolute inset-0 flex flex-wrap items-end justify-center gap-6 p-6 sm:gap-8 lg:justify-start">
            <div>
              <p className="text-2xl font-black tabular-nums text-white sm:text-3xl">1:08:37</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/50">Start</p>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-[#f4d23c] sm:text-3xl">59:14</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/50">Pro HYROX</p>
            </div>
            <div>
              <p className="text-2xl font-black tabular-nums text-[#4ade80] sm:text-3xl">9:23</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/50">Improvement</p>
            </div>
          </div>
        </div>
      </div>

      <HomepagePhoneCarousel
        items={PROOF_PHONE_SCREENS}
        phoneSize="md"
        className="mt-12"
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
