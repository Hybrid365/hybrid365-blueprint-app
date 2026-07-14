import { SYSTEM_BODY, SYSTEM_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { PRODUCT_PHONE_SCREENS } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneCarousel } from "./HomepagePhoneCarousel";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

const SYSTEM_FEATURES = [
  "Programme",
  "Check-ins",
  "Benchmarks",
  "Progress",
  "Sessions",
] as const;

export function HomepageProduct() {
  return (
    <HomepageSection id="system" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>{SYSTEM_HEADLINE.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {SYSTEM_HEADLINE.line1}
          <span className="block text-[#f4d23c]">{SYSTEM_HEADLINE.line2}</span>
        </HomepageHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
          {SYSTEM_BODY}
        </p>

        <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
          {SYSTEM_FEATURES.map((feature) => (
            <li
              key={feature}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55"
            >
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <HomepagePhoneCarousel
        items={PRODUCT_PHONE_SCREENS}
        phoneSize="md"
        className="mt-14"
      />
    </HomepageSection>
  );
}
