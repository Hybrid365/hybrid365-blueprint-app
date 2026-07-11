import Image from "next/image";
import { AthleteDashboardMockup } from "@/components/hyrox-landing/AthleteDashboardMockup";
import {
  FOUNDER_HERO_IMAGE,
  FOUNDER_STATS,
} from "@/app/lib/homepage/founderStats";
import { HERO_PILLAR_LABELS } from "@/app/lib/homepage/pillars";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageHeading,
  HomepageEyebrow,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageHero() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,210,60,0.08),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
          {/* Copy */}
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HomepageEyebrow>Hybrid performance coaching</HomepageEyebrow>

            <HomepageHeading
              as="h1"
              className="text-[clamp(2rem,6.5vw,3.75rem)]"
            >
              Run fast.{" "}
              <span className="text-[#f4d23c]">Lift heavy.</span>
              <span className="mt-1 block">Look good. Perform better.</span>
            </HomepageHeading>

            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {HERO_PILLAR_LABELS.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/75 sm:text-[11px]"
                >
                  {label}
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg lg:mx-0">
              Structured hybrid coaching for athletes who want to get fitter,
              faster and stronger — with a proven HYROX performance edge.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50 lg:mx-0">
              Built from the same system used to progress from{" "}
              <strong className="font-semibold text-white/80">1:08:37</strong> to{" "}
              <strong className="font-semibold text-[#f4d23c]">59:14</strong> Pro
              Solo HYROX.
            </p>

            <ul className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-3 border-y border-white/10 py-5 lg:mx-0 lg:justify-start">
              {FOUNDER_STATS.map((stat) => (
                <li key={stat.label} className="min-w-[6.5rem] text-center lg:text-left">
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

            <HomepageCtaRow size="large" className="mt-8 lg:mt-8">
              <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large" className={homepageCtaClass}>
                Start My Free Training Week
              </PrimaryCta>
              <SecondaryCta href={HOMEPAGE_NAV.method} className={homepageCtaClass}>
                Explore the Method
              </SecondaryCta>
            </HomepageCtaRow>
          </div>

          {/* Visual: coaching UI + founder proof */}
          <div className="relative mx-auto flex w-full max-w-[min(100%,360px)] justify-center pb-12 sm:pb-14 lg:mx-0 lg:max-w-none lg:justify-center lg:pb-0">
            <div className="relative">
              <AthleteDashboardMockup size="md" className="relative z-10" />

              <div className="absolute -bottom-6 -left-6 z-20 w-[38%] min-w-[110px] max-w-[140px] overflow-hidden rounded-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:-left-10 sm:max-w-[160px]">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={FOUNDER_HERO_IMAGE.src}
                    alt={FOUNDER_HERO_IMAGE.alt}
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="160px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-[9px] font-bold uppercase tracking-wider text-white/90">
                    Founder · HYROX Pro
                  </p>
                </div>
              </div>

              <div
                className="pointer-events-none absolute -right-4 top-8 z-0 hidden h-[85%] w-[70%] rounded-[2rem] border border-white/10 bg-white/[0.03] sm:block"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
