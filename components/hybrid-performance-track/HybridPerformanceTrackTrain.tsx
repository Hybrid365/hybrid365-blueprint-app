import { HYBRID_PERFORMANCE_TRACK_TRAIN } from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceTrackTrain() {
  const copy = HYBRID_PERFORMANCE_TRACK_TRAIN;

  return (
    <HomepageSection id="train" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.55rem,5vw,2.55rem)]">
          {copy.headline}
        </HomepageHeading>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/50 lg:mx-0">
          {copy.supporting}
        </p>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {copy.pillars.map((pillar) => (
          <article key={pillar.id} className="bg-[#080808] px-5 py-7 sm:px-6 sm:py-8">
            <h3 className="text-[clamp(1.65rem,4vw,2.15rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-[#f4d23c]">
              {pillar.title}
            </h3>
            <p className="mt-4 text-[13px] leading-relaxed text-white/52">{pillar.body}</p>
          </article>
        ))}
      </div>
    </HomepageSection>
  );
}
