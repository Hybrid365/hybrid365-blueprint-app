import { BELIEF_HEADLINE } from "@/app/lib/homepage/brandCopy";
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

const STRUCTURE_GAPS = [
  "No progression across running, strength and conditioning",
  "No threshold development or pacing standards",
  "No block structure — just hard sessions stacked on hard sessions",
  "No accountability when life gets busy",
  "No environment that matches how seriously you train",
] as const;

export function HomepageWhy() {
  return (
    <HomepageSection id="belief" variant="dark">
      <div className="mx-auto max-w-3xl text-center">
        <HomepageEyebrow>The real problem</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3.25rem)]">
          {BELIEF_HEADLINE.line1}
          <span className="mt-2 block text-[#f4d23c]">{BELIEF_HEADLINE.line2}</span>
        </HomepageHeading>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
          Your work ethic is not the problem. Your structure is. Hybrid365 gives
          you the system, standards and environment to turn effort into performance.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:gap-4">
        {STRUCTURE_GAPS.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-sm leading-relaxed text-white/75"
          >
            {item}
          </div>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-base font-medium text-white/80">
        You do not need more random workouts or motivational content. You need a
        coaching system with clear progression — proven through HYROX, running and
        strength results.
      </p>

      <HomepageCtaRow className="justify-center lg:justify-center">
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
        <SecondaryCta href={HOMEPAGE_NAV.system} className={homepageCtaClass}>
          Explore The System
        </SecondaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
