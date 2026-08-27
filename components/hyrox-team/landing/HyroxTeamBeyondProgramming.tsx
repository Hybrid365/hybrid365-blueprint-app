import Image from "next/image";
import { HYROX_ONE_TO_ONE_BEYOND } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxTeamBeyondProgramming() {
  return (
    <HyroxOneToOneSection id="experience" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_BEYOND.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.8rem,6vw,3.1rem)]">
          {HYROX_ONE_TO_ONE_BEYOND.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_BEYOND.headline[1]}</span>
        </HyroxOneToOneHeading>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {HYROX_ONE_TO_ONE_BEYOND.body}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {HYROX_ONE_TO_ONE_BEYOND.photos.map((photo) => (
          <div key={photo.src} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#111]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 45vw, 220px"
            />
          </div>
        ))}
      </div>

      <ul className="mt-8 columns-1 gap-x-10 sm:columns-2">
        {HYROX_ONE_TO_ONE_BEYOND.points.map((point) => (
          <li
            key={point}
            className="mb-2.5 break-inside-avoid text-sm font-semibold uppercase tracking-[0.08em] text-white/70"
          >
            {point}
          </li>
        ))}
      </ul>
    </HyroxOneToOneSection>
  );
}
