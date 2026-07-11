import { RESULTS_BODY, RESULTS_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { ATHLETE_RESULTS } from "@/app/lib/homepage/athleteResults";
import { PROOF_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { AthleteResultCard } from "./AthleteResultCard";
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
    <HomepageSection id="results" variant="dark">
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

      <div className="mt-10 flex flex-wrap items-baseline justify-center gap-6 border-y border-white/8 py-8 lg:justify-start">
        <div>
          <p className="text-3xl font-black tabular-nums text-white/70 sm:text-4xl">1:08:37</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Start</p>
        </div>
        <div className="hidden h-px w-12 bg-gradient-to-r from-white/20 via-[#f4d23c] to-white/20 sm:block" aria-hidden />
        <div>
          <p className="text-3xl font-black tabular-nums text-[#f4d23c] sm:text-4xl">59:14</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Pro Solo HYROX</p>
        </div>
        <div className="hidden h-px w-12 bg-gradient-to-r from-white/20 via-[#f4d23c] to-white/20 sm:block" aria-hidden />
        <div>
          <p className="text-3xl font-black tabular-nums text-[#4ade80] sm:text-4xl">9:23</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Improvement</p>
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
