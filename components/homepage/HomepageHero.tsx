import Image from "next/image";
import { FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import { LANDING_HERO } from "@/app/lib/homepage/landingStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageHero() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[60px] sm:pt-[68px]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 py-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-14">
          <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <HomepageEyebrow>{LANDING_HERO.brand}</HomepageEyebrow>
            <HomepageHeading
              as="h1"
              className="text-[clamp(2.05rem,8vw,3.75rem)] leading-[0.9] tracking-[-0.05em]"
            >
              {LANDING_HERO.headline}
            </HomepageHeading>
            <p className="mx-auto mt-5 max-w-md text-[15px] font-medium leading-snug text-white/75 sm:text-lg lg:mx-0">
              {LANDING_HERO.supporting}
            </p>
            <p className="mx-auto mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 sm:text-xs lg:mx-0">
              {LANDING_HERO.credibility}
            </p>

            <HomepageCtaRow size="large" className="mt-7">
              <PrimaryCta href={LANDING_HERO.primaryHref} size="large" className={homepageCtaClass}>
                {LANDING_HERO.primaryCta}
              </PrimaryCta>
              <SecondaryCta href={LANDING_HERO.secondaryHref} className={homepageCtaClass}>
                {LANDING_HERO.secondaryCta}
              </SecondaryCta>
            </HomepageCtaRow>

            <a
              href={LANDING_HERO.seeHowItWorksHref}
              className="mt-5 inline-flex min-h-[44px] items-center justify-center text-[11px] font-bold uppercase tracking-[0.16em] text-white/35 transition hover:text-white/60"
            >
              {LANDING_HERO.seeHowItWorks} ↓
            </a>
          </div>

          <div className="lg:justify-self-end">
            {/* Future founder video drops into this well — same crop, no layout change. */}
            <div
              data-hero-media="founder"
              className="relative mx-auto aspect-[4/5] w-full max-w-[360px] overflow-hidden rounded-[1.75rem] bg-black sm:max-w-[400px] lg:max-w-[440px]"
            >
              <Image
                src={FOUNDER_TRANSFORM.currentPhoto.src}
                alt={LANDING_HERO.mediaAlt}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 1024px) 90vw, 440px"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
