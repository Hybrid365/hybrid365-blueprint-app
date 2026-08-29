import { HYBRID_PERFORMANCE_TRACK_IDENTITY } from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceTrackIdentity() {
  const copy = HYBRID_PERFORMANCE_TRACK_IDENTITY;

  return (
    <HomepageSection id="standard" variant="accent" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.25rem)]">
          {copy.headline[0]}
          <span className="block text-[#f4d23c]">{copy.headline[1]}</span>
        </HomepageHeading>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-[15px] lg:mx-0">
          {copy.body}
        </p>
      </div>
    </HomepageSection>
  );
}
