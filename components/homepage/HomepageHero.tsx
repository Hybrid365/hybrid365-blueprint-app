import { HERO_PILLAR_LABELS } from "@/app/lib/homepage/pillars";
import { BRAND_TAGLINE, PROOF_MARQUEE_ITEMS } from "@/app/lib/homepage/brandCopy";
import { HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageProofMarquee } from "./HomepageMotion";
import { HomepageHeroPhoneFan } from "./HomepageHeroPhoneFan";
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

            <HomepageCtaRow size="large" className="mt-8">
              <PrimaryCta href={FREE_WEEK_HYROX_URL} size="large" className={homepageCtaClass}>
                Start My Free Training Week
              </PrimaryCta>
              <SecondaryCta href={HOMEPAGE_NAV.method} className={homepageCtaClass}>
                See The Method
              </SecondaryCta>
            </HomepageCtaRow>
          </div>

          <HomepageHeroPhoneFan />
        </div>
      </div>

      <HomepageProofMarquee items={PROOF_MARQUEE_ITEMS} />
    </section>
  );
}
