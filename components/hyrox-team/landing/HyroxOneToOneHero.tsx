import {
  HYROX_ONE_TO_ONE_APPLY_HREF,
  HYROX_ONE_TO_ONE_HERO,
  HYROX_ONE_TO_ONE_NAV,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { YouTubeEmbed, HYROX_TEAM_TRAILER_VIDEO_ID } from "@/components/hyrox-team/YouTubeEmbed";
import {
  HyroxOneToOneApplyCta,
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSecondaryCta,
} from "./hyroxOneToOneLandingUi";

export function HyroxOneToOneHero() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-14">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_HERO.eyebrow}</HyroxOneToOneEyebrow>
            <HyroxOneToOneHeading
              as="h1"
              className="text-[clamp(2.05rem,8vw,3.65rem)] leading-[0.9] tracking-[-0.05em]"
            >
              {HYROX_ONE_TO_ONE_HERO.headline[0]}
              <span className="block">{HYROX_ONE_TO_ONE_HERO.headline[1]}</span>
              <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_HERO.headline[2]}</span>
            </HyroxOneToOneHeading>
            <p className="mx-auto mt-5 max-w-md text-[15px] font-medium leading-snug text-white/75 sm:text-lg lg:mx-0">
              {HYROX_ONE_TO_ONE_HERO.body}
            </p>
            <p className="mx-auto mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 sm:text-xs lg:mx-0">
              {HYROX_ONE_TO_ONE_HERO.credibility}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <HyroxOneToOneApplyCta
                href={HYROX_ONE_TO_ONE_APPLY_HREF}
                size="large"
                className="w-full sm:w-auto"
              >
                {HYROX_ONE_TO_ONE_HERO.primaryCta}
              </HyroxOneToOneApplyCta>
              <HyroxOneToOneSecondaryCta
                href={HYROX_ONE_TO_ONE_NAV.athletes}
                className="w-full sm:w-auto"
              >
                {HYROX_ONE_TO_ONE_HERO.secondaryCta} ↓
              </HyroxOneToOneSecondaryCta>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#f4d23c] lg:text-left">
              {HYROX_ONE_TO_ONE_HERO.videoLabel}
            </p>
            <div className="overflow-hidden rounded-[1.5rem] bg-black">
              <YouTubeEmbed
                videoId={HYROX_TEAM_TRAILER_VIDEO_ID}
                title="Hybrid365 HYROX Team coaching"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
