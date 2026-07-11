import { BRAND_MOTTO, FINAL_CTA_BODY, FINAL_CTA_HEADLINE } from "@/app/lib/homepage/brandCopy";
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
      className="relative overflow-hidden border-b-0 pb-28 md:pb-24"
      variant="dark"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,210,60,0.1),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
          {BRAND_MOTTO}
        </p>
        <HomepageHeading as="h2" className="mt-4 text-[clamp(2rem,7vw,3.5rem)]">
          {FINAL_CTA_HEADLINE}
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          {FINAL_CTA_BODY}
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
      </div>
    </HomepageSection>
  );
}
