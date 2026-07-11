import { HERO_PILLAR_LABELS } from "@/app/lib/homepage/pillars";
import {
  BRAND_MOTTO,
  BRAND_TAGLINE_LINES,
  HERO_PROOF_COPY,
  HERO_STATS,
  HERO_SUPPORTING_COPY,
  PROOF_MARQUEE_ITEMS,
} from "@/app/lib/homepage/brandCopy";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageProofMarquee } from "./HomepageMotion";
import { HomepageCoachingEcosystem } from "./HomepageCoachingEcosystem";
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(244,210,60,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.02),transparent_40%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-6 py-8 sm:gap-8 sm:py-12 lg:grid-cols-[1.22fr_0.78fr] lg:gap-10 lg:py-14">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HomepageEyebrow>{BRAND_MOTTO}</HomepageEyebrow>

            <HomepageHeading
              as="h1"
              className="text-[clamp(2rem,6.5vw,3.5rem)] leading-[0.86] tracking-[-0.045em]"
            >
              <span className="block">{BRAND_TAGLINE_LINES[0]}.</span>
              <span className="block text-[#f4d23c]">{BRAND_TAGLINE_LINES[1]}.</span>
              <span className="block">{BRAND_TAGLINE_LINES[2]}.</span>
              <span className="block text-white/95">{BRAND_TAGLINE_LINES[3]}.</span>
            </HomepageHeading>

            <ul className="mt-4 flex flex-wrap justify-center gap-1.5 lg:justify-start">
              {HERO_PILLAR_LABELS.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/55 sm:text-[10px]"
                >
                  {label}
                </li>
              ))}
            </ul>

            <p className="mx-auto mt-5 max-w-md text-base font-medium leading-snug text-white/80 sm:text-lg lg:mx-0">
              {HERO_SUPPORTING_COPY}
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45 lg:mx-0">
              {HERO_PROOF_COPY}
            </p>

            <HomepageCtaRow size="large" className="mt-6">
              <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large" className={homepageCtaClass}>
                Start My Free Training Week
              </PrimaryCta>
              <SecondaryCta href={HOMEPAGE_NAV.method} className={homepageCtaClass}>
                See The Method
              </SecondaryCta>
            </HomepageCtaRow>

            <dl className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:mx-0 lg:max-w-none">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-black tabular-nums text-white sm:text-2xl">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="overflow-visible lg:justify-self-end">
            <HomepageCoachingEcosystem />
          </div>
        </div>
      </div>

      <HomepageProofMarquee items={PROOF_MARQUEE_ITEMS} />
    </section>
  );
}
