import Image from "next/image";
import { FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import { HYROX_ONE_TO_ONE_PROOF } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxOneToOneProof() {
  return (
    <HyroxOneToOneSection id="sub-60" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_PROOF.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {HYROX_ONE_TO_ONE_PROOF.headline}
        </HyroxOneToOneHeading>
      </div>

      <p className="mt-8 text-center text-[clamp(2.4rem,11vw,5rem)] font-black leading-none tracking-[-0.05em] text-white lg:text-left">
        <span className="text-white/35">{HYROX_ONE_TO_ONE_PROOF.from}</span>
        <span className="mx-2 text-[#f4d23c]" aria-hidden>
          →
        </span>
        <span>{HYROX_ONE_TO_ONE_PROOF.to}</span>
      </p>
      <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 lg:text-left">
        {HYROX_ONE_TO_ONE_PROOF.event}
        <span className="mx-3 text-white/20">·</span>
        5K {HYROX_ONE_TO_ONE_PROOF.fiveK}
      </p>

      <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-[1.5rem]">
        <div className="relative aspect-[3/4]">
          <Image
            src={FOUNDER_TRANSFORM.startPhoto.src}
            alt={FOUNDER_TRANSFORM.startPhoto.alt}
            fill
            className="object-cover object-top grayscale"
            sizes="(max-width: 1024px) 50vw, 400px"
          />
        </div>
        <div className="relative aspect-[3/4]">
          <Image
            src={FOUNDER_TRANSFORM.currentPhoto.src}
            alt={FOUNDER_TRANSFORM.currentPhoto.alt}
            fill
            className="object-cover object-top"
            sizes="(max-width: 1024px) 50vw, 400px"
          />
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-3 text-center text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-left">
        {HYROX_ONE_TO_ONE_PROOF.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </HyroxOneToOneSection>
  );
}
