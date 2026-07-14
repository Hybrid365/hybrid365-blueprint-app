import { PERFORMANCE_PILLARS } from "@/app/lib/homepage/pillars";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

export function HomepageMethod() {
  return (
    <HomepageSection id="method" variant="dark">
      <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
        <HomepageEyebrow>The method</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          Four standards.
          <span className="block text-[#f4d23c]">One integrated system.</span>
        </HomepageHeading>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {PERFORMANCE_PILLARS.map((pillar) => (
          <article
            key={pillar.id}
            className="flex min-h-[140px] flex-col justify-end rounded-2xl border border-white/10 bg-[#0a0a0a]/80 p-5 sm:min-h-[168px] sm:p-6"
          >
            <h3 className="text-[clamp(1.1rem,3vw,1.5rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
              {pillar.title}
            </h3>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/35">
              {pillar.headline}
            </p>
          </article>
        ))}
      </div>
    </HomepageSection>
  );
}
