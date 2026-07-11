import { SYSTEM_BODY, SYSTEM_HEADLINE } from "@/app/lib/homepage/brandCopy";
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
        <HomepageEyebrow>{SYSTEM_HEADLINE.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          {SYSTEM_HEADLINE.line1}
          <span className="block text-[#f4d23c]">{SYSTEM_HEADLINE.line2}</span>
        </HomepageHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
          {SYSTEM_BODY}
        </p>
        <p className="mt-3 text-sm text-white/40">
          A preview — explore each screen in depth below.
        </p>
      </div>

      <HomepagePhoneCarousel
        items={PRODUCT_PHONE_SCREENS}
        phoneSize="md"
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
