import {
  HYBRID_PERFORMANCE_APPLY_HREF,
  HYBRID_PERFORMANCE_INCLUDED,
} from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
  PrimaryCta,
  homepageCtaClass,
} from "@/components/homepage/homepageUi";

function TickIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-[#f4d23c]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function HybridPerformanceIncluded() {
  const copy = HYBRID_PERFORMANCE_INCLUDED;

  return (
    <HomepageSection id="included" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {copy.headline}
        </HomepageHeading>
        <p className="mt-4 text-sm text-white/45">{copy.note}</p>
      </div>

      <ul className="mx-auto mt-8 max-w-3xl columns-1 gap-x-12 sm:columns-2">
        {copy.items.map((item) => (
          <li key={item} className="mb-3 flex break-inside-avoid gap-3 text-sm font-semibold text-[#e9e9e9]">
            <TickIcon />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <PrimaryCta href={HYBRID_PERFORMANCE_APPLY_HREF} className={homepageCtaClass}>
          Apply for 1-1 coaching
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
