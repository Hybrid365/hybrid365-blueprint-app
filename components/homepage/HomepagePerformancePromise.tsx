import { PERFORMANCE_PROMISE_COPY } from "@/app/lib/homepage/performancePromise";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepagePerformancePromise() {
  return (
    <HomepageSection id="promise" variant="dark">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center sm:p-10 lg:mx-0 lg:text-left">
        <HomepageEyebrow>{PERFORMANCE_PROMISE_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.5rem,4vw,2.25rem)]">
          {PERFORMANCE_PROMISE_COPY.headline}
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
          {PERFORMANCE_PROMISE_COPY.body}
        </p>
        <p className="mt-4 text-sm text-white/40">{PERFORMANCE_PROMISE_COPY.note}</p>
      </div>
    </HomepageSection>
  );
}
