import { STANDARD_BODY, STANDARD_HEADLINE } from "@/app/lib/homepage/brandCopy";
import { STANDARD_COLLAGE_PHOTOS } from "@/app/lib/homepage/athletePhotography";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import { HomepageEditorialPhoto } from "./HomepageEditorialPhoto";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageStandard() {
  const [primary, secondary, tertiary, accent] = STANDARD_COLLAGE_PHOTOS;

  return (
    <HomepageSection id="standard" variant="dark" className="overflow-hidden">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative mx-auto h-[340px] w-full max-w-lg sm:h-[400px] lg:mx-0 lg:h-[460px] lg:max-w-none">
          {/* Primary — large, bleeds left */}
          <div className="absolute inset-y-[8%] left-0 z-10 w-[72%]">
            <HomepageEditorialPhoto
              photo={primary}
              className="h-full w-full rounded-sm"
              priority
              sizes="(max-width: 1024px) 70vw, 35vw"
            />
          </div>

          {/* Secondary — overlapping top right */}
          <div className="absolute right-0 top-0 z-20 h-[48%] w-[46%] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <HomepageEditorialPhoto
              photo={secondary}
              className="h-full w-full rounded-sm border border-white/10"
              sizes="(max-width: 1024px) 40vw, 22vw"
            />
          </div>

          {/* Tertiary — bottom right overlap */}
          <div className="absolute bottom-0 right-[6%] z-30 h-[42%] w-[40%] shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
            <HomepageEditorialPhoto
              photo={tertiary}
              className="h-full w-full rounded-sm border border-white/8"
              sizes="(max-width: 1024px) 38vw, 20vw"
            />
          </div>

          {/* Accent — small depth layer */}
          <div className="absolute bottom-[18%] left-[4%] z-0 h-[36%] w-[34%] opacity-40 blur-[1px]">
            <HomepageEditorialPhoto
              photo={accent}
              className="h-full w-full rounded-sm"
              sizes="30vw"
            />
          </div>

          <p className="absolute bottom-3 left-3 z-40 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35">
            Hybrid365 · The standard
          </p>
        </div>

        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <HomepageEyebrow>{STANDARD_HEADLINE.eyebrow}</HomepageEyebrow>
          <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
            {STANDARD_HEADLINE.line1}
            <span className="mt-1 block text-[#f4d23c]">{STANDARD_HEADLINE.line2}</span>
          </HomepageHeading>
          <p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg">
            {STANDARD_BODY}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/45">
            Effort. Discipline. Commitment. This is what the brand looks like —
            not stock fitness imagery.
          </p>

          <HomepageCtaRow className="mt-8">
            <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
              Start My Free Training Week
            </PrimaryCta>
          </HomepageCtaRow>
        </div>
      </div>
    </HomepageSection>
  );
}
