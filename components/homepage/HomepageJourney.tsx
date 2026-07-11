import Image from "next/image";
import {
  FOUNDER_STORY_IMAGE,
  FOUNDER_TRANSFORMATION,
} from "@/app/lib/homepage/founderStats";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

export function HomepageJourney() {
  return (
    <HomepageSection variant="accent">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:items-center">
        <div className="relative aspect-[4/5] min-h-[320px] overflow-hidden rounded-2xl border border-white/10 sm:min-h-[420px]">
          <Image
            src={FOUNDER_STORY_IMAGE.src}
            alt={FOUNDER_STORY_IMAGE.alt}
            fill
            className="object-cover object-top brightness-[0.85] contrast-[1.05]"
            sizes="(max-width: 1024px) 100vw, 45vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f4d23c]">
              Kieran Higgs · Founder
            </p>
            <p className="mt-1 text-2xl font-black text-white">Former pro footballer</p>
          </div>
        </div>

        <div>
          <HomepageEyebrow>My journey</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            This wasn&apos;t luck.
          </HomepageHeading>

          <div className="mt-8 flex items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-white/70 sm:text-4xl">
                {FOUNDER_TRANSFORMATION.from}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                Start
              </p>
            </div>
            <div className="flex h-px flex-1 bg-gradient-to-r from-white/20 via-[#f4d23c] to-white/20" aria-hidden />
            <div className="text-center">
              <p className="text-3xl font-black tabular-nums text-[#f4d23c] sm:text-4xl">
                {FOUNDER_TRANSFORMATION.to}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                {FOUNDER_TRANSFORMATION.label}
              </p>
            </div>
          </div>

          <p className="mt-8 text-base leading-relaxed text-white/65">
            Years of refining running economy, threshold development, aerobic
            capacity, strength endurance and race-specific station work — tested in
            real HYROX races, not theory.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            That same methodology now shapes every programme Hybrid365 athletes
            follow. Structured blocks. Clear progression. Recovery built in.
          </p>

          <div className="mt-8">
            <PrimaryCta href={FREE_WEEK_HYROX_URL}>Build My Free Week</PrimaryCta>
          </div>
        </div>
      </div>
    </HomepageSection>
  );
}
