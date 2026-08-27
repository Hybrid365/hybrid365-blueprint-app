import {
  HYROX_ONE_TO_ONE_PILLARS,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxTeamPillars() {
  return (
    <HyroxOneToOneSection id="offer" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_PILLARS.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,6.5vw,3.15rem)]">
          {HYROX_ONE_TO_ONE_PILLARS.headline[0]}
          <span className="block">{HYROX_ONE_TO_ONE_PILLARS.headline[1]}</span>
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_PILLARS.headline[2]}</span>
        </HyroxOneToOneHeading>
      </div>

      <div className="mt-10 grid gap-8 sm:mt-12 lg:grid-cols-3 lg:gap-10">
        {HYROX_ONE_TO_ONE_PILLARS.items.map((item) => (
          <article key={item.id}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
              {item.title}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-[15px]">{item.body}</p>
          </article>
        ))}
      </div>
    </HyroxOneToOneSection>
  );
}
