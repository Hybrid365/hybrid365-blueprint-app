import { getCaseStudiesForSurface } from "@/app/lib/proof";
import { HYBRID_PERFORMANCE_RESULTS } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { AthleteCaseStudyCard } from "@/components/proof/AthleteCaseStudyCard";
import {
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceClientResults() {
  const copy = HYBRID_PERFORMANCE_RESULTS;
  const studies = getCaseStudiesForSurface("hybrid-performance");

  return (
    <HomepageSection id="results" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {copy.headline}
        </HomepageHeading>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 lg:mx-0">
          {copy.supporting}
        </p>
      </div>

      <ul className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
        {studies.map((study) => (
          <li key={study.id}>
            <a
              href={`#${study.id}`}
              className="block h-full rounded-[1rem] border border-white/[0.08] bg-white/[0.03] px-2 py-3 transition hover:border-[#f4d23c]/40 sm:rounded-[1.15rem] sm:px-4 sm:py-4"
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#f4d23c] sm:text-[10px] sm:tracking-[0.18em]">
                {study.athlete.firstName}
              </p>
              <p className="mt-1.5 text-[10px] font-black uppercase leading-snug tracking-tight text-white sm:text-[13px]">
                {study.contrastLine}
              </p>
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-12 space-y-16 sm:space-y-20">
        {studies.map((study) => (
          <AthleteCaseStudyCard key={study.id} study={study} />
        ))}
      </div>
    </HomepageSection>
  );
}
