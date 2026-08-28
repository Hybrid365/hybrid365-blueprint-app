import { HYBRID_PERFORMANCE_FINAL } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageHeading,
  HomepageSection,
  PrimaryCta,
  homepageCtaClass,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceFinalCta() {
  const copy = HYBRID_PERFORMANCE_FINAL;

  return (
    <HomepageSection
      id="apply"
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
          <PrimaryCta href={copy.primaryHref} size="large" className={homepageCtaClass}>
            {copy.primaryCta}
          </PrimaryCta>
        </div>
        <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-[#f4d23c]">
          {copy.motto}
        </p>
      </div>
    </HomepageSection>
  );
}
