import { HYBRID_PERFORMANCE_TRACK_HOW } from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceTrackHow() {
  const copy = HYBRID_PERFORMANCE_TRACK_HOW;

  return (
    <HomepageSection id="how-it-works" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-4xl lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.55rem,5vw,2.55rem)]">
          {copy.headline}
        </HomepageHeading>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/55 lg:mx-0">
          {copy.supporting}
        </p>
      </div>

      <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {copy.steps.map((step) => (
          <li key={step.number} className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
              {step.number}
            </p>
            <h3 className="mt-2 text-[15px] font-black uppercase tracking-[-0.03em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-white/48">{step.body}</p>
          </li>
        ))}
      </ol>
    </HomepageSection>
  );
}
