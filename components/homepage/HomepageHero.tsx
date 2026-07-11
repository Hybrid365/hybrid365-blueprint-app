import Image from "next/image";
import {
  FOUNDER_HERO_IMAGE,
  FOUNDER_STATS,
} from "@/app/lib/homepage/founderStats";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageHeading,
  HomepageEyebrow,
  PrimaryCta,
  SecondaryCta,
} from "./homepageUi";

export function HomepageHero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div className="absolute inset-0">
        <Image
          src={FOUNDER_HERO_IMAGE.src}
          alt={FOUNDER_HERO_IMAGE.alt}
          fill
          priority
          className="object-cover object-top opacity-40 grayscale-[15%] contrast-[1.05]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/75 to-[#050505]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/90 via-[#050505]/50 to-transparent" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-60px)] max-w-[1200px] flex-col justify-end px-4 pb-24 sm:min-h-[calc(100svh-68px)] sm:px-6 sm:pb-28 lg:px-8 lg:pb-32">
        <HomepageEyebrow>HYROX performance coaching</HomepageEyebrow>

        <HomepageHeading
          as="h1"
          className="max-w-[14ch] text-[clamp(2.5rem,9vw,4.75rem)]"
        >
          Become a Faster{" "}
          <span className="text-[#f4d23c]">HYROX Athlete</span>
        </HomepageHeading>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
          Performance coaching built from the exact system used to progress from{" "}
          <strong className="font-semibold text-white">1:08:37</strong> to{" "}
          <strong className="font-semibold text-[#f4d23c]">59:14</strong> Pro
          Solo.
        </p>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-y border-white/10 py-5">
          {FOUNDER_STATS.map((stat) => (
            <li key={stat.label} className="min-w-[7rem]">
              <p className="text-xl font-black tabular-nums tracking-tight text-white sm:text-2xl">
                {stat.value}
                {"placeholder" in stat && stat.placeholder ? (
                  <span className="ml-1 text-xs font-normal text-white/40">*</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large">
            Build My Free Week
          </PrimaryCta>
          <SecondaryCta href={HOMEPAGE_NAV.method}>Explore the Method</SecondaryCta>
        </div>
      </div>
    </section>
  );
}
