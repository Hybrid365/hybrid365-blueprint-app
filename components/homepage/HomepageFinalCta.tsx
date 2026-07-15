import { BRAND_MOTTO, FINAL_CTA_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageFinalCta() {
  return (
    <HomepageSection
      id="start"
      className="relative overflow-hidden border-b-0 pb-28 md:pb-24"
      variant="dark"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.08),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <HomepageHeading as="h2" className="text-[clamp(2rem,7vw,3.75rem)]">
          {FINAL_CTA_HEADLINE.line1}
          <span className="block text-[#f4d23c]">{FINAL_CTA_HEADLINE.line2}</span>
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/50">
          Choose your priority. Share your starting point. See how Hybrid365 would structure your
          week.
        </p>
        <HomepageCtaRow size="large" className="mt-10 justify-center lg:justify-center">
          <PrimaryCta
            href={FREE_WEEK_HYROX_URL}
            size="large"
            className={`${homepageCtaClass} max-w-sm sm:max-w-none`}
          >
            Start My Free Training Week
          </PrimaryCta>
        </HomepageCtaRow>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {BRAND_MOTTO}
        </p>
      </div>
    </HomepageSection>
  );
}
