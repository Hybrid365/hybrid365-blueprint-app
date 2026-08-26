import { HYROX_ONE_TO_ONE_WHO } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxTeamWhoFor() {
  return (
    <HyroxOneToOneSection id="who" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_WHO.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.7rem,5.8vw,2.85rem)]">
          {HYROX_ONE_TO_ONE_WHO.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_WHO.headline[1]}</span>
        </HyroxOneToOneHeading>
      </div>

      <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2">
        {HYROX_ONE_TO_ONE_WHO.fits.map((item) => (
          <li
            key={item}
            className="border-t border-white/10 pt-3 text-sm leading-relaxed text-white/70 sm:text-[15px]"
          >
            {item}
          </li>
        ))}
      </ul>
    </HyroxOneToOneSection>
  );
}
