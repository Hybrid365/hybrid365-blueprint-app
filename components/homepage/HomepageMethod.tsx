import { PERFORMANCE_PILLARS } from "@/app/lib/homepage/pillars";
import { FREE_WEEK_HYROX_URL, HOMEPAGE_NAV } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  SecondaryCta,
  HomepageCtaRow,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageMethod() {
  return (
    <HomepageSection id="method">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>Performance pillars</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.75rem,5vw,3rem)]">
          Four standards.
          <span className="block text-[#f4d23c]">One hybrid system.</span>
        </HomepageHeading>
        <p className="mt-5 text-base text-white/55">
          Run fast. Lift heavy. Look athletic. Perform better — integrated for
          HYROX athletes, hybrid trainers, runners and lifters who want both.
        </p>
      </div>

      <div className="mt-12 -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-px lg:overflow-hidden lg:rounded-2xl lg:border lg:border-white/10 lg:bg-white/10 lg:px-0 lg:pb-0 xl:grid-cols-4">
        {PERFORMANCE_PILLARS.map((pillar, index) => (
          <article
            key={pillar.id}
            className="w-[min(85vw,280px)] shrink-0 snap-start rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 lg:w-auto lg:rounded-none lg:border-0"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-xl font-black uppercase tracking-tight text-white">
              {pillar.title}
            </h3>
            <p className="mt-2 text-sm font-semibold text-white/80">{pillar.headline}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">{pillar.body}</p>
          </article>
        ))}
      </div>

      <HomepageCtaRow className="mt-10">
        <PrimaryCta href={FREE_WEEK_HYROX_URL} className={homepageCtaClass}>
          Start My Free Training Week
        </PrimaryCta>
        <SecondaryCta href={HOMEPAGE_NAV.system} className={homepageCtaClass}>
          Explore The System
        </SecondaryCta>
      </HomepageCtaRow>
    </HomepageSection>
  );
}
