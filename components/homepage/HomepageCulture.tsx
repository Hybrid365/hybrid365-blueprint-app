import {
  COMMUNITY_CRITERIA,
  CULTURE_BODY,
  CULTURE_HEADLINE,
  BRAND_MOTTO,
} from "@/app/lib/homepage/brandCopy";
import { COMMUNITY_EDITORIAL_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { FREE_WEEK_HYROX_URL, HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageCulture() {
  const [left, center, right] = COMMUNITY_EDITORIAL_PHOTOS;

  return (
    <HomepageSection id="community" variant="accent" className="relative overflow-hidden !px-0">
      {/* Full-bleed editorial band — photography leads */}
      <div className="relative mx-auto max-w-[1200px] lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]">
          <div className="absolute inset-0 grid grid-cols-12">
            <div className="relative col-span-5 sm:col-span-4">
              <HomepageEditorialPhoto
                photo={left}
                className="absolute inset-0"
                intensity="full"
                sizes="(max-width: 1024px) 40vw, 22vw"
              />
            </div>
            <div className="relative col-span-4 sm:col-span-4">
              <HomepageEditorialPhoto
                photo={center}
                className="absolute inset-0"
                intensity="full"
                sizes="(max-width: 1024px) 35vw, 20vw"
              />
            </div>
            <div className="relative col-span-3 sm:col-span-4">
              <HomepageEditorialPhoto
                photo={right}
                className="absolute inset-0"
                intensity="full"
                sizes="(max-width: 1024px) 30vw, 18vw"
              />
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050505]/30 via-[#050505]/55 to-[#080808]/95 lg:bg-gradient-to-r lg:from-transparent lg:via-[#080808]/40 lg:to-[#080808]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/60"
            aria-hidden
          />

          <div className="absolute bottom-8 left-6 z-10 sm:left-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#f4d23c]">
              {BRAND_MOTTO}
            </p>
            <p className="mt-2 max-w-xs text-lg font-black uppercase tracking-tight text-white sm:text-xl">
              I&apos;ve found my people.
            </p>
          </div>
        </div>

        <div className="relative z-10 px-4 py-12 sm:px-6 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-16">
          <HomepageEyebrow>Community</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            {CULTURE_HEADLINE}
          </HomepageHeading>
          <p className="mt-6 text-base leading-relaxed text-white/60">
            {CULTURE_BODY}
          </p>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              For people who…
            </p>
            <ul className="mt-4 space-y-3">
              {COMMUNITY_CRITERIA.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <span className="mt-0.5 shrink-0 text-[#4ade80]" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <HomepageCtaRow className="mt-8">
            <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
              Start My Free Training Week
            </PrimaryCta>
            <SecondaryCta href={HOMEPAGE_NAV.team} className={homepageCtaClass}>
              Meet The Team
            </SecondaryCta>
          </HomepageCtaRow>
        </div>
      </div>
    </HomepageSection>
  );
}
