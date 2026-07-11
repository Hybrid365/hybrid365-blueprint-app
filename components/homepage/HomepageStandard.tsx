import { STANDARD_BODY, STANDARD_HEADLINE, BRAND_MOTTO } from "@/app/lib/homepage/brandCopy";
import { STANDARD_COLLAGE_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageStandard() {
  const [primary, secondary, tertiary] = STANDARD_COLLAGE_PHOTOS;

  return (
    <HomepageSection id="standard" variant="dark" className="overflow-hidden">
      <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
        {/* Editorial collage — no rounded cards */}
        <div className="relative mx-auto h-[380px] w-full max-w-lg sm:h-[440px] lg:mx-0 lg:h-[520px] lg:max-w-none">
          <div className="absolute inset-y-0 left-[-5%] z-10 w-[68%]">
            <HomepageEditorialPhoto
              photo={primary}
              className="h-full w-full"
              priority
              intensity="full"
              sizes="(max-width: 1024px) 72vw, 38vw"
            />
          </div>

          <div className="absolute right-[-3%] top-0 z-20 h-[52%] w-[50%]">
            <HomepageEditorialPhoto
              photo={secondary}
              className="h-full w-full"
              intensity="full"
              sizes="(max-width: 1024px) 44vw, 24vw"
            />
          </div>

          <div className="absolute bottom-[-2%] right-[8%] z-30 h-[44%] w-[58%]">
            <HomepageEditorialPhoto
              photo={tertiary}
              className="h-full w-full"
              intensity="full"
              sizes="(max-width: 1024px) 55vw, 30vw"
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-40 bg-gradient-to-r from-transparent via-transparent to-[#050505]/20"
            aria-hidden
          />

          <p className="absolute bottom-4 left-4 z-50 text-[9px] font-bold uppercase tracking-[0.22em] text-[#f4d23c]/70">
            {BRAND_MOTTO}
          </p>
        </div>

        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>{STANDARD_HEADLINE.eyebrow}</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            {STANDARD_HEADLINE.line1}
            <span className="mt-1 block text-[#f4d23c]">{STANDARD_HEADLINE.line2}</span>
          </HomepageHeading>
          <p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">
            {STANDARD_BODY}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            These aren&apos;t models. They&apos;re the exact type of people we
            coach — hybrid athletes who already show up and refuse average.
          </p>

          <HomepageCtaRow className="mt-8">
            <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
              Start My Free Training Week
            </PrimaryCta>
          </HomepageCtaRow>
        </div>
      </div>
    </HomepageSection>
  );
}
