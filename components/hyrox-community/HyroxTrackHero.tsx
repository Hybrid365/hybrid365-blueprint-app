import Image from "next/image";
import {
  getHyroxTrackJoinUrl,
  HYROX_TRACK_HERO,
  HYROX_TRACK_NAV,
} from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackEyebrow,
  HyroxTrackHeading,
  HyroxTrackJoinCta,
  HyroxTrackSecondaryCta,
} from "./hyroxTrackUi";

export function HyroxTrackHero() {
  const joinUrl = getHyroxTrackJoinUrl();

  return (
    <section className="relative overflow-hidden bg-[#050505] pt-8 sm:pt-12">
      <div className="absolute inset-0">
        <Image
          src="/images/hyrox-team/Hyrox-Result.jpg"
          alt=""
          fill
          className="object-cover object-center opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/92 to-[#050505]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <HyroxTrackEyebrow>{HYROX_TRACK_HERO.eyebrow}</HyroxTrackEyebrow>
          <HyroxTrackHeading
            as="h1"
            className="text-[clamp(2rem,6.5vw,3.5rem)] leading-[0.88]"
          >
            {HYROX_TRACK_HERO.headline[0]}
            <span className="block text-[#f4d23c]">{HYROX_TRACK_HERO.headline[1]}</span>
          </HyroxTrackHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
            {HYROX_TRACK_HERO.body}
          </p>
          <p className="mt-5 inline-flex rounded-full border border-[#f4d23c]/35 bg-[#f4d23c]/10 px-4 py-2 text-sm font-black text-[#f4d23c]">
            {HYROX_TRACK_HERO.price}
          </p>

          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-white/55 sm:text-sm">
            {HYROX_TRACK_HERO.reassurance.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <HyroxTrackJoinCta href={joinUrl} size="large">
              {HYROX_TRACK_HERO.primaryCta}
            </HyroxTrackJoinCta>
            <HyroxTrackSecondaryCta href={HYROX_TRACK_NAV.included}>
              {HYROX_TRACK_HERO.secondaryCta}
            </HyroxTrackSecondaryCta>
          </div>

          <a
            href={HYROX_TRACK_NAV.promise}
            className="mt-5 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]/80 transition hover:text-[#f4d23c]"
          >
            {HYROX_TRACK_HERO.guaranteeCue} →
          </a>
        </div>
      </div>
    </section>
  );
}
