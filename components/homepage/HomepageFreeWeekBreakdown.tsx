import {
  FREE_WEEK_BREAKDOWN_COPY,
  FREE_WEEK_FEATURES,
} from "@/app/lib/homepage/freeWeekBreakdown";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageFreeWeekBreakdown() {
  return (
    <HomepageSection id="free-week" variant="accent" className="!py-20 sm:!py-24">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{FREE_WEEK_BREAKDOWN_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {FREE_WEEK_BREAKDOWN_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{FREE_WEEK_BREAKDOWN_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
          {FREE_WEEK_BREAKDOWN_COPY.body}
        </p>
      </div>

      <ul className="mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {FREE_WEEK_FEATURES.map((feature) => (
          <li
            key={feature}
            className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 px-4 py-3 text-sm font-semibold text-white/75"
          >
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-1 text-center lg:text-left">
        {FREE_WEEK_BREAKDOWN_COPY.reassurance.map((line) => (
          <p key={line} className="text-sm font-medium text-white/50">
            {line}
          </p>
        ))}
      </div>

      <div className="mt-10 flex justify-center lg:justify-start">
        <PrimaryCta
          href={FREE_WEEK_BREAKDOWN_COPY.ctaHref}
          size="large"
          className={homepageCtaClass}
        >
          {FREE_WEEK_BREAKDOWN_COPY.ctaLabel}
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
