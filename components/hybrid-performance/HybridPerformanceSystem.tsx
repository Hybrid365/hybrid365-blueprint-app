import { HYBRID_PERFORMANCE_SYSTEM } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
} from "@/components/homepage/homepageUi";

export function HybridPerformanceSystem() {
  const copy = HYBRID_PERFORMANCE_SYSTEM;
  const steps = copy.steps;

  return (
    <HomepageSection id="system" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.7rem,5.5vw,2.85rem)]">
          {copy.headline}
        </HomepageHeading>
      </div>

      <ol className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-3xl">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={step.number} className="flex gap-4 sm:gap-5">
              <div className="flex w-8 shrink-0 flex-col items-center sm:w-10">
                <span className="text-[13px] font-black tabular-nums tracking-[0.08em] text-[#f4d23c] sm:text-sm">
                  {step.number}
                </span>
                {!isLast ? (
                  <span className="mt-1 flex flex-1 flex-col items-center" aria-hidden>
                    <span className="text-[11px] leading-none text-[#f4d23c]/70">↓</span>
                    <span className="mt-1 min-h-[18px] w-px flex-1 bg-gradient-to-b from-[#f4d23c]/35 to-white/10" />
                  </span>
                ) : null}
              </div>
              <div className={isLast ? "pb-0" : "pb-7 sm:pb-8"}>
                <h3 className="text-[15px] font-black uppercase tracking-tight text-white sm:text-base">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/55 sm:text-[15px]">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </HomepageSection>
  );
}
