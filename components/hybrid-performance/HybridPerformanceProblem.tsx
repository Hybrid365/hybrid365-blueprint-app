import { HYBRID_PERFORMANCE_PROBLEM } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceProblem() {
  const copy = HYBRID_PERFORMANCE_PROBLEM;

  return (
    <HomepageSection id="problem" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {copy.headline[0]}
          <span className="block text-[#f4d23c]">{copy.headline[1]}</span>
        </HomepageHeading>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-[15px] lg:mx-0">
          {copy.body}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/40 lg:mx-0">
          {copy.note}
        </p>
      </div>
    </HomepageSection>
  );
}
