import Image from "next/image";
import { HYROX_ONE_TO_ONE_ATHLETES } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxOneToOneAthletes() {
  return (
    <HyroxOneToOneSection id="athletes" variant="dark">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HyroxOneToOneEyebrow>CURRENT HYBRID365 ATHLETES</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          REAL ATHLETES.
          <span className="block text-[#f4d23c]">INDIVIDUAL GOALS.</span>
        </HyroxOneToOneHeading>
      </div>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe athletes →
      </p>
      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
        {HYROX_ONE_TO_ONE_ATHLETES.map((athlete) => (
          <article
            key={athlete.id}
            className="w-[min(78vw,260px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:w-auto"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={athlete.photoSrc}
                alt={athlete.photoAlt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 78vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <h3 className="text-sm font-black uppercase tracking-tight text-white">
                  {athlete.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-[#f4d23c]">
                  {athlete.hyroxPb ? `HYROX ${athlete.hyroxPb}` : null}
                  {athlete.hyroxPb && athlete.fiveK ? " · " : null}
                  {athlete.fiveK ? `5K ${athlete.fiveK}` : null}
                </p>
                {athlete.currentGoal ? (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                    Current goal
                    <span className="mt-0.5 block text-white">{athlete.currentGoal}</span>
                  </p>
                ) : athlete.coachingFocus ? (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    {athlete.coachingFocus}
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </HyroxOneToOneSection>
  );
}
