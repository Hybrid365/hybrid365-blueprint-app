import Image from "next/image";
import {
  HYROX_ONE_TO_ONE_APPLY_HREF,
  HYROX_ONE_TO_ONE_BEYOND,
  HYROX_ONE_TO_ONE_FINAL,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneApplyCta,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxTeamFinalCta() {
  return (
    <HyroxOneToOneSection id="apply" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-[1.5rem] sm:grid-cols-4 sm:gap-3">
        {HYROX_ONE_TO_ONE_BEYOND.photos.map((photo) => (
          <div key={photo.src} className="relative aspect-[3/4] bg-[#111]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 50vw, 220px"
            />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-2xl text-center">
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,6.2vw,3.15rem)]">
          {HYROX_ONE_TO_ONE_FINAL.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_FINAL.headline[1]}</span>
        </HyroxOneToOneHeading>
        <p className="mt-4 text-base text-white/60">{HYROX_ONE_TO_ONE_FINAL.body}</p>
        <div className="mt-7 flex justify-center">
          <HyroxOneToOneApplyCta
            href={HYROX_ONE_TO_ONE_APPLY_HREF}
            size="large"
            className="w-full sm:w-auto"
          >
            {HYROX_ONE_TO_ONE_FINAL.cta}
          </HyroxOneToOneApplyCta>
        </div>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
          {HYROX_ONE_TO_ONE_FINAL.note}
        </p>
      </div>
    </HyroxOneToOneSection>
  );
}
