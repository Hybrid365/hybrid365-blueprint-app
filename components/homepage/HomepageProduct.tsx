import { PRODUCT_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepagePhoneCarousel } from "./HomepagePhoneCarousel";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageProduct() {
  return (
    <HomepageSection id="system" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>The system</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          Your training, progress and accountability
          <span className="block text-[#f4d23c]">— all in one place</span>
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          A premium coaching interface — structured sessions, weekly check-ins,
          progress tracking and benchmarks. Not a PDF. Not a spreadsheet.
        </p>
      </div>

      <HomepagePhoneCarousel
        items={PRODUCT_PHONE_SCREENS}
        phoneSize="lg"
        className="mt-12"
      />

      <HomepageCtaRow>
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
