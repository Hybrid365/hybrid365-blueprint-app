import { BRAND_MOTTO } from "@/app/lib/homepage/brandCopy";
import { LANDING_FINAL } from "@/app/lib/homepage/landingStory";
import {
  HomepageSection,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageTextLink,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageFinalCta() {
  return (
    <HomepageSection
      id="start"
      className="relative overflow-hidden border-b-0 !py-16 pb-28 sm:!py-20 md:pb-24"
      variant="dark"
    >
      <div className="relative mx-auto max-w-3xl text-center">
        <HomepageHeading as="h2" className="text-[clamp(2rem,7vw,3.5rem)]">
          {LANDING_FINAL.headline}
        </HomepageHeading>

        <HomepageCtaRow size="large" className="mt-10 sm:justify-center lg:justify-center">
          <PrimaryCta href={LANDING_FINAL.primaryHref} size="large" className={homepageCtaClass}>
            {LANDING_FINAL.primaryCta}
          </PrimaryCta>
          <SecondaryCta href={LANDING_FINAL.secondaryHref} className={homepageCtaClass}>
            {LANDING_FINAL.secondaryCta}
          </SecondaryCta>
        </HomepageCtaRow>

        <p className="mt-6">
          <HomepageTextLink href={LANDING_FINAL.talkHref} className="normal-case tracking-[0.04em] text-sm">
            {LANDING_FINAL.talkLabel}
          </HomepageTextLink>
        </p>

        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {BRAND_MOTTO}
        </p>
      </div>
    </HomepageSection>
  );
}
