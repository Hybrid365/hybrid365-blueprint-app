import { HYROX_ONE_TO_ONE_INCLUSIONS } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

function InclusionCheck() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="mt-[3px] h-3.5 w-3.5 shrink-0 text-[#f4d23c]"
    >
      <path
        d="M3.2 8.2 6.1 11.1 12.8 4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HyroxTeamInclusions() {
  return (
    <HyroxOneToOneSection id="offer" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_INCLUSIONS.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,6.2vw,3.15rem)]">
          {HYROX_ONE_TO_ONE_INCLUSIONS.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_INCLUSIONS.headline[1]}</span>
        </HyroxOneToOneHeading>
      </div>

      <ul className="mt-10 grid sm:mt-12 sm:grid-cols-2 sm:gap-x-12 lg:gap-x-16">
        {HYROX_ONE_TO_ONE_INCLUSIONS.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 border-b border-white/[0.08] py-3.5 text-[15px] font-medium leading-snug text-white/80 sm:py-4"
          >
            <InclusionCheck />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </HyroxOneToOneSection>
  );
}
