import {
  COMMUNITY_CRITERIA,
  CULTURE_BODY,
  CULTURE_HEADLINE,
} from "@/app/lib/homepage/brandCopy";
import { ATHLETE_EDITORIAL_PHOTOS } from "@/app/lib/homepage/athletePhotography";
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
  return (
    <HomepageSection id="community" variant="accent" className="overflow-hidden">
      <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <div className="relative mx-auto h-[320px] w-full max-w-md sm:h-[380px] lg:mx-0 lg:h-[420px] lg:max-w-none">
          <div className="absolute inset-y-0 left-[-6%] w-[78%]">
            <HomepageEditorialPhoto
              photo={ATHLETE_EDITORIAL_PHOTOS.communityRun}
              className="h-full w-full"
              sizes="(max-width: 1024px) 80vw, 40vw"
            />
          </div>
          <div className="absolute right-0 top-[10%] z-10 h-[55%] w-[48%] shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
            <HomepageEditorialPhoto
              photo={ATHLETE_EDITORIAL_PHOTOS.hybridGrind}
              className="h-full w-full border border-white/10"
              sizes="(max-width: 1024px) 45vw, 24vw"
            />
          </div>
          <div className="absolute bottom-6 left-6 z-20">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
              Hybrid365 Team
            </p>
            <p className="mt-1 max-w-[200px] text-sm font-semibold text-white/80">
              Coached individually. Built as a team.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>Community</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            {CULTURE_HEADLINE}
          </HomepageHeading>
          <p className="mt-6 text-base leading-relaxed text-white/60">
            {CULTURE_BODY}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-5 text-left sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              For people who…
            </p>
            <ul className="mt-4 space-y-3">
              {COMMUNITY_CRITERIA.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-white/75">
                  <span className="mt-0.5 text-[#4ade80]" aria-hidden>
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
