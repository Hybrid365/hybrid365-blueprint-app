import Image from "next/image";
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
    <section className="relative overflow-hidden bg-[#050505]">
      <div className="absolute inset-0">
        <Image
          src="/images/hyrox-team/Hyrox-Result.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/94 to-[#050505]/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/45" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div>
            <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_HERO.eyebrow}</HyroxOneToOneEyebrow>
            <HyroxOneToOneHeading
              as="h1"
              className="text-[clamp(2rem,6.2vw,3.65rem)] leading-[0.88]"
            >
              {HYROX_ONE_TO_ONE_HERO.headline[0]}
              <span className="block">{HYROX_ONE_TO_ONE_HERO.headline[1]}</span>
              <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_HERO.headline[2]}</span>
            </HyroxOneToOneHeading>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {HYROX_ONE_TO_ONE_HERO.body}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <HyroxOneToOneApplyCta href={HYROX_ONE_TO_ONE_APPLY_HREF} size="large">
                {HYROX_ONE_TO_ONE_HERO.primaryCta}
              </HyroxOneToOneApplyCta>
              <HyroxOneToOneSecondaryCta href={HYROX_ONE_TO_ONE_NAV.included}>
                {HYROX_ONE_TO_ONE_HERO.secondaryCta}
              </HyroxOneToOneSecondaryCta>
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f4d23c]">
              {HYROX_ONE_TO_ONE_HERO.videoLabel}
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <YouTubeEmbed
                videoId={HYROX_TEAM_TRAILER_VIDEO_ID}
                title="Hybrid365 1-1 HYROX coaching"
              />
            </div>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-1 gap-3 border-t border-white/[0.08] pt-8 sm:grid-cols-3 sm:gap-6">
          {HYROX_ONE_TO_ONE_HERO.proof.map((item) => (
            <div key={item.label} className="sm:pr-4">
              <dt className="text-lg font-black uppercase tracking-tight text-white sm:text-xl">
                {item.value}
              </dt>
              <dd className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                {item.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
