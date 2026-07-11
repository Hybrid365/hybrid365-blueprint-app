import {
  BELIEF_BODY,
  BELIEF_HEADLINE,
  BRAND_MOTTO,
} from "@/app/lib/homepage/brandCopy";
import { FREE_WEEK_HYROX_URL, HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

const DIRECTION_GAPS = [
  "No clarity on whether your training is actually progressing",
  "No structure connecting running, strength and recovery",
  "No feedback loop when sessions stack up and fatigue builds",
  "No environment that matches how seriously you already train",
  "No system — just more effort without direction",
] as const;

export function HomepageWhy() {
  return (
    <HomepageSection id="belief" variant="dark">
      <div className="mx-auto max-w-3xl text-center">
        <HomepageEyebrow>Identity</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3.25rem)]">
          {BELIEF_HEADLINE.line1}
          <span className="mt-1 block text-[#f4d23c]">{BELIEF_HEADLINE.line2}</span>
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          {BELIEF_BODY}
        </p>
        <p className="mx-auto mt-4 max-w-xl text-sm font-bold uppercase tracking-[0.14em] text-white/35">
          {BRAND_MOTTO}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:gap-4">
        {DIRECTION_GAPS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 text-left text-sm leading-relaxed text-white/70"
          >
            {item}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-base font-medium text-white/75">
        You don&apos;t need more motivation. You need clarity, structure and a
        standard that matches your work ethic.
      </p>

      <HomepageCtaRow className="justify-center lg:justify-center">
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
        <SecondaryCta href={HOMEPAGE_NAV.standard} className={homepageCtaClass}>
          See The Standard
        </SecondaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
