import Image from "next/image";
import { AthleteDashboardMockup } from "@/components/hyrox-landing/AthleteDashboardMockup";
import {
  FOUNDER_HERO_IMAGE,
  FOUNDER_STATS,
} from "@/app/lib/homepage/founderStats";
import { HERO_PILLAR_LABELS } from "@/app/lib/homepage/pillars";
import { BRAND_TAGLINE, PROOF_MARQUEE_ITEMS } from "@/app/lib/homepage/brandCopy";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageProofMarquee } from "./HomepageMotion";
import {
  HomepageHeading,
  HomepageEyebrow,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageHero() {
  const taglineParts = BRAND_TAGLINE.split(". ").filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,210,60,0.1),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.03),transparent_40%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HomepageEyebrow>High-performance hybrid coaching</HomepageEyebrow>

            <HomepageHeading
              as="h1"
              className="text-[clamp(2rem,6.5vw,3.5rem)]"
            >
              {taglineParts[0]}.
              <span className="mt-1 block text-[#f4d23c]">{taglineParts[1]}.</span>
              <span className="mt-1 block">{taglineParts[2]}.</span>
              <span className="mt-1 block text-white/95">{taglineParts[3]}.</span>
            </HomepageHeading>

            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {HERO_PILLAR_LABELS.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f4d23c] sm:text-[11px]"
                >
                  {label}
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg lg:mx-0">
              Built for hard workers who want more from themselves — structure,
              standards and a coaching environment that matches your mindset.
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50 lg:mx-0">
              Proven through HYROX, running and strength progress — including{" "}
              <strong className="font-semibold text-white/80">1:08:37 → 59:14</strong>{" "}
              Pro Solo.
            </p>

            <ul className="mx-auto mt-8 hidden max-w-lg flex-wrap justify-center gap-x-6 gap-y-3 lg:mx-0 lg:flex lg:justify-start">
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

            <HomepageCtaRow size="large" className="mt-8">
              <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large" className={homepageCtaClass}>
                Start My Free Training Week
              </PrimaryCta>
              <SecondaryCta href={HOMEPAGE_NAV.method} className={homepageCtaClass}>
                See The Method
              </SecondaryCta>
            </HomepageCtaRow>
          </div>

          <div className="relative mx-auto flex w-full max-w-[min(100%,380px)] justify-center pb-14 sm:max-w-[400px] lg:mx-0 lg:max-w-none lg:justify-center lg:pb-0">
            <div className="relative w-full">
              <AthleteDashboardMockup size="md" className="relative z-10 mx-auto" />

              <div className="absolute -bottom-4 -left-2 z-20 w-[36%] min-w-[100px] max-w-[130px] overflow-hidden rounded-xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:-left-6 sm:max-w-[150px]">
                <div className="relative aspect-[3/4]">
                  <Image
                    src={FOUNDER_HERO_IMAGE.src}
                    alt={FOUNDER_HERO_IMAGE.alt}
                    fill
                    priority
                    className="object-cover object-top"
                    sizes="150px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <p className="absolute bottom-2 left-2 right-2 text-[9px] font-bold uppercase tracking-wider text-white/90">
                    Founder · HYROX Pro
                  </p>
                </div>
              </div>

              <div
                className="pointer-events-none absolute -right-2 top-6 z-0 hidden h-[88%] w-[72%] rounded-[2rem] border border-[#f4d23c]/10 bg-[radial-gradient(circle_at_center,rgba(244,210,60,0.08),transparent_70%)] sm:block"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>

      <HomepageProofMarquee items={PROOF_MARQUEE_ITEMS} />
    </section>
  );
}
