import {
  PRIMARY_PROOF_BODY,
  PRIMARY_PROOF_METRICS,
  RESULTS_HEADLINE,
} from "@/app/lib/homepage/brandCopy";
import { ATHLETE_EDITORIAL_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import { HomepageEyebrow, HomepageHeading } from "./homepageUi";

export function HomepageProof() {
  return (
    <section
      id="results"
      className="scroll-mt-[72px] border-b border-white/[0.06] bg-[#050505]"
    >
      <div className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
          <HomepageEyebrow>{RESULTS_HEADLINE.eyebrow}</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
            {RESULTS_HEADLINE.line1}
            <span className="block text-[#f4d23c]">{RESULTS_HEADLINE.line2}</span>
          </HomepageHeading>
          <p className="mt-5 text-base leading-relaxed text-white/55 sm:text-lg">
            {PRIMARY_PROOF_BODY}
          </p>
        </div>
      </div>

      <div className="relative mx-auto mt-10 max-w-[1200px] px-4 pb-16 sm:mt-12 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="relative min-h-[260px] w-full overflow-hidden sm:min-h-[320px] lg:min-h-[360px]">
          <HomepageEditorialPhoto
            photo={ATHLETE_EDITORIAL_PHOTOS.treadmillEffort}
            className="absolute inset-0"
            intensity="full"
            sizes="(max-width: 1200px) 100vw, 1200px"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,#050505_0%,#050505/55_38%,transparent_72%),linear-gradient(to_right,#050505/80_0%,transparent_22%,transparent_78%,#050505/80_100%)]"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-8 sm:pb-10 lg:px-12 lg:pb-12">
            <dl className="mx-auto grid max-w-[1000px] grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-4 lg:gap-x-8">
              {PRIMARY_PROOF_METRICS.map((metric) => (
                <div key={metric.label} className="text-center sm:text-left">
                  <dd
                    className={
                      "accent" in metric && metric.accent
                        ? "text-[clamp(1.75rem,4.5vw,3.25rem)] font-black tabular-nums leading-none text-[#f4d23c]"
                        : "text-[clamp(1.75rem,4.5vw,3.25rem)] font-black tabular-nums leading-none text-white"
                    }
                  >
                    {metric.value}
                  </dd>
                  <dt className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
                    {metric.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
