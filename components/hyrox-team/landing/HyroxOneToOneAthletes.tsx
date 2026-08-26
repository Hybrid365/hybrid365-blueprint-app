import Image from "next/image";
import { HYROX_ONE_TO_ONE_ATHLETES } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { HomepageSnapCarousel } from "@/components/homepage/HomepageSnapCarousel";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

function primaryMarker(athlete: (typeof HYROX_ONE_TO_ONE_ATHLETES)[number]) {
  if (athlete.fiveK) return { label: "5K", value: athlete.fiveK };
  if (athlete.hyroxPb) return { label: "HYROX", value: athlete.hyroxPb };
  return null;
}

export function HyroxOneToOneAthletes() {
  return (
    <HyroxOneToOneSection id="athletes" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HyroxOneToOneEyebrow>CURRENT HYBRID365 ATHLETES</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,6vw,3rem)]">
          REAL ATHLETES.
          <span className="block text-[#f4d23c]">INDIVIDUAL GOALS.</span>
        </HyroxOneToOneHeading>
      </div>

      <div className="mt-8 lg:mt-10">
        <HomepageSnapCarousel ariaLabel="Current Hybrid365 athletes">
          {HYROX_ONE_TO_ONE_ATHLETES.map((athlete) => {
            const primary = primaryMarker(athlete);
            const secondary =
              athlete.fiveK && athlete.hyroxPb
                ? { label: "HYROX", value: athlete.hyroxPb }
                : null;

            return (
              <article key={athlete.id} className="overflow-hidden">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-[#111]">
                  <Image
                    src={athlete.photoSrc}
                    alt={athlete.photoAlt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 86vw, 280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {primary ? (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
                          {primary.label}
                        </p>
                        <p className="mt-1 text-[2rem] font-black leading-none tracking-tight text-white tabular-nums">
                          {primary.value}
                        </p>
                      </>
                    ) : null}
                    {secondary ? (
                      <p className="mt-2 text-sm font-bold text-[#f4d23c]">
                        {secondary.label} {secondary.value}
                      </p>
                    ) : null}
                    <h3 className="mt-4 text-base font-black uppercase tracking-tight text-white">
                      {athlete.name}
                    </h3>
                    {athlete.currentGoal ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                        {athlete.currentGoal}
                      </p>
                    ) : athlete.coachingFocus ? (
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
                        {athlete.coachingFocus}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </HomepageSnapCarousel>
      </div>
    </HyroxOneToOneSection>
  );
}
