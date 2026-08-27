import Image from "next/image";
import { FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import { HYROX_ONE_TO_ONE_PROOF } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

const FOUNDER_PROOF_PHOTOS = [
  {
    src: FOUNDER_TRANSFORM.startPhoto.src,
    alt: FOUNDER_TRANSFORM.startPhoto.alt,
    label: HYROX_ONE_TO_ONE_PROOF.from,
    imageClassName: "object-cover object-top grayscale",
  },
  {
    src: FOUNDER_TRANSFORM.currentPhoto.src,
    alt: FOUNDER_TRANSFORM.currentPhoto.alt,
    label: "Development",
    imageClassName: "object-cover object-top",
  },
  {
    src: HYROX_ONE_TO_ONE_PROOF.imageSrc,
    alt: HYROX_ONE_TO_ONE_PROOF.imageAlt,
    label: HYROX_ONE_TO_ONE_PROOF.to,
    imageClassName: "object-cover object-top",
  },
] as const;

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

      <div className="mt-8 grid grid-cols-3 gap-1 overflow-hidden rounded-[1.15rem] sm:gap-1.5 sm:rounded-[1.5rem]">
        {FOUNDER_PROOF_PHOTOS.map((photo) => (
          <figure key={photo.src} className="relative aspect-[3/4] bg-[#111]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className={photo.imageClassName}
              sizes="(max-width: 1024px) 33vw, 360px"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-2 pt-8 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white/85 sm:px-2 sm:text-[11px]">
              {photo.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-3 text-center text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-left">
        {HYROX_ONE_TO_ONE_PROOF.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </HyroxOneToOneSection>
  );
}
