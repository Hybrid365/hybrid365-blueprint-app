import { PERFORMANCE_PILLARS } from "@/app/lib/homepage/pillars";
import { FREE_WEEK_HYROX_URL } from "@/app/lib/homepage/homepageLinks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
} from "./homepageUi";

export function HomepageMethod() {
  return (
    <HomepageSection id="method">
      <HomepageEyebrow>The method</HomepageEyebrow>
      <HomepageHeading className="max-w-2xl text-[clamp(1.75rem,5vw,3rem)]">
        Four foundations.
        <span className="block text-[#f4d23c]">One performance system.</span>
      </HomepageHeading>
      <p className="mt-5 max-w-xl text-base text-white/55">
        Not four separate programmes — four integrated inputs to becoming a better
        HYROX athlete.
      </p>

      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
        {PERFORMANCE_PILLARS.map((pillar, index) => (
          <article
            key={pillar.id}
            className={`bg-[#0a0a0a] p-6 sm:p-8 ${
              index === PERFORMANCE_PILLARS.length - 1 ? "sm:col-span-2 sm:flex sm:gap-10" : ""
            }`}
          >
            <div className={index === PERFORMANCE_PILLARS.length - 1 ? "sm:flex-1" : ""}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
                {pillar.title}
              </h3>
              <p className="mt-2 text-sm font-semibold text-white/80">
                {pillar.headline}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {pillar.body}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <PrimaryCta href={FREE_WEEK_HYROX_URL}>Build My Free Week</PrimaryCta>
      </div>
    </HomepageSection>
  );
}
