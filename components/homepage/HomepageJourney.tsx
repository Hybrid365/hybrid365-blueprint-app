import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import {
  ATHLETE_EDITORIAL_PHOTOS,
  RESULTS_EDITORIAL_PHOTOS,
} from "@/app/lib/homepage/athletePhotography";
import { FOUNDER_TRANSFORMATION } from "@/app/lib/homepage/founderStats";
import { BRAND_MOTTO, RESULTS_BODY } from "@/app/lib/homepage/brandCopy";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageJourney() {
  const [effortPrimary, effortSecondary] = RESULTS_EDITORIAL_PHOTOS;

  return (
    <HomepageSection variant="accent" className="overflow-hidden">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:items-center">
        <div className="relative mx-auto h-[380px] w-full max-w-md sm:h-[440px] lg:mx-0 lg:h-[500px] lg:max-w-none">
          <div className="absolute inset-y-[2%] left-[-6%] w-[72%]">
            <HomepageEditorialPhoto
              photo={effortPrimary}
              className="h-full w-full"
              intensity="full"
              sizes="(max-width: 1024px) 75vw, 38vw"
            />
          </div>
          <div className="absolute right-[-2%] top-[4%] z-10 h-[48%] w-[46%]">
            <HomepageEditorialPhoto
              photo={ATHLETE_EDITORIAL_PHOTOS.raceFinish}
              className="h-full w-full"
              sizes="(max-width: 1024px) 42vw, 22vw"
            />
          </div>
          <div className="absolute bottom-0 left-[10%] z-20 h-[38%] w-[55%]">
            <HomepageEditorialPhoto
              photo={effortSecondary}
              className="h-full w-full"
              sizes="(max-width: 1024px) 50vw, 26vw"
            />
          </div>
          <div className="absolute bottom-6 right-6 z-30 rounded-full border border-[#f4d23c]/30 bg-[#050505]/85 px-4 py-2 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">
              {BRAND_MOTTO}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>The results</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            Earned — not claimed.
          </HomepageHeading>

          <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6 lg:justify-start">
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-white/70 sm:text-4xl">
                {FOUNDER_TRANSFORMATION.from}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Start
              </p>
            </div>
            <div className="flex h-px w-12 bg-gradient-to-r from-white/20 via-[#f4d23c] to-white/20 sm:w-auto sm:flex-1" aria-hidden />
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-[#f4d23c] sm:text-4xl">
                {FOUNDER_TRANSFORMATION.to}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                {FOUNDER_TRANSFORMATION.label}
              </p>
            </div>
          </div>

          <p className="mt-8 text-base leading-relaxed text-white/65">
            {RESULTS_BODY}
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/50">
            The work looks like this. The results look like 59:14.
          </p>

          <HomepageCtaRow>
            <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
              Start My Free Training Week
            </PrimaryCta>
          </HomepageCtaRow>
        </div>
      </div>
    </HomepageSection>
  );
}
