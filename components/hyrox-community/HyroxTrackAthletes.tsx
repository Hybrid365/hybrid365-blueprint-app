import Image from "next/image";
import { HYROX_TRACK_ATHLETES } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

export function HyroxTrackAthletes() {
  return (
    <HyroxTrackSection id="athletes" variant="dark">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HyroxTrackEyebrow>Real HYROX athletes</HyroxTrackEyebrow>
        <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          Real athletes.
          <span className="block text-[#f4d23c]">One HYROX standard.</span>
        </HyroxTrackHeading>
      </div>

      <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe athletes →
      </p>
      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:px-0">
        {HYROX_TRACK_ATHLETES.map((athlete) => (
          <article
            key={athlete.id}
            className="w-[min(72vw,240px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] lg:w-auto"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={athlete.photoSrc}
                alt={athlete.photoAlt}
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 72vw, 20vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <h3 className="text-sm font-black uppercase tracking-tight text-white">
                  {athlete.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-[#f4d23c]">
                  {athlete.hyroxPb ? `HYROX ${athlete.hyroxPb}` : null}
                  {athlete.hyroxPb && athlete.fiveK ? " · " : null}
                  {athlete.fiveK ? `5K ${athlete.fiveK}` : null}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {athlete.focus}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </HyroxTrackSection>
  );
}
