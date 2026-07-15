import {
  BRAND_MOTTO,
  BRAND_TAGLINE_LINES,
  HERO_SUPPORTING_COPY,
} from "@/app/lib/homepage/brandCopy";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageCoachingEcosystem } from "./HomepageCoachingEcosystem";
import {
  HomepageHeading,
  HomepageEyebrow,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageHero() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,210,60,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.02),transparent_40%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 py-8 sm:gap-8 sm:py-12 lg:grid-cols-[1.22fr_0.78fr] lg:gap-10 lg:py-14">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HomepageEyebrow>{BRAND_MOTTO}</HomepageEyebrow>

            <HomepageHeading
              as="h1"
              className="text-[clamp(2rem,6.5vw,3.5rem)] leading-[0.86] tracking-[-0.045em]"
            >
              <span className="block">{BRAND_TAGLINE_LINES[0]}.</span>
              <span className="block text-[#f4d23c]">{BRAND_TAGLINE_LINES[1]}.</span>
              <span className="block">{BRAND_TAGLINE_LINES[2]}.</span>
              <span className="block text-white/95">{BRAND_TAGLINE_LINES[3]}.</span>
            </HomepageHeading>

            <p className="mx-auto mt-5 max-w-md text-base font-medium leading-snug text-white/80 sm:text-lg lg:mx-0">
              {HERO_SUPPORTING_COPY}
            </p>

            <HomepageCtaRow size="large" className="mt-6">
              <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large" className={homepageCtaClass}>
                Start My Free Training Week
              </PrimaryCta>
              <SecondaryCta href={HOMEPAGE_NAV.system} className={homepageCtaClass}>
                See The System
              </SecondaryCta>
            </HomepageCtaRow>
            <p className="mx-auto mt-3 text-[11px] font-medium tracking-wide text-white/40 sm:text-xs lg:mx-0">
              Free · Personalised to your goal · No payment required
            </p>
          </div>

          <div className="overflow-visible lg:justify-self-end">
            <HomepageCoachingEcosystem />
          </div>
        </div>
      </div>
    </section>
  );
}
