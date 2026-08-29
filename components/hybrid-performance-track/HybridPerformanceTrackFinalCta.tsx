import {
  getHybridPerformanceTrackJoinUrl,
  HYBRID_PERFORMANCE_TRACK_FINAL,
} from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import {
  HomepageHeading,
  HomepageSection,
  homepageCtaClass,
} from "@/components/homepage/homepageUi";
import { TrackJoinCta } from "@/components/hybrid-performance-track/TrackJoinCta";

export function HybridPerformanceTrackFinalCta() {
  const copy = HYBRID_PERFORMANCE_TRACK_FINAL;

  return (
    <HomepageSection
      id="join"
      className="relative overflow-hidden border-b-0 !py-16 pb-28 sm:!py-20 md:pb-24"
      variant="dark"
    >
      <div className="relative mx-auto max-w-3xl text-center">
        <HomepageHeading as="h2" className="text-[clamp(2rem,7vw,3.5rem)]">
          {copy.headline[0]}
          <span className="block text-[#f4d23c]">{copy.headline[1]}</span>
        </HomepageHeading>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {copy.supporting}
        </p>
        <div className="mt-10 flex justify-center">
          <TrackJoinCta
            href={getHybridPerformanceTrackJoinUrl()}
            size="large"
            className={homepageCtaClass}
          >
            {copy.primaryCta}
          </TrackJoinCta>
        </div>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {copy.motto}
        </p>
      </div>
    </HomepageSection>
  );
}
