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
    label: HYROX_ONE_TO_ONE_PROOF.finishPhotoLabel,
    imageClassName: "object-cover object-top",
  },
] as const;

export function HyroxOneToOneProof() {
  return (
    <HyroxOneToOneSection id="sub-60" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_PROOF.eyebrow}</HyroxOneToOneEyebrow>
        <p className="text-[clamp(2.15rem,9.2vw,4.6rem)] font-black leading-none tracking-[-0.05em] text-white">
          <span className="text-white/35">{HYROX_ONE_TO_ONE_PROOF.from}</span>
          <span className="mx-1.5 text-[#f4d23c] sm:mx-2" aria-hidden>
            →
          </span>
          <span>{HYROX_ONE_TO_ONE_PROOF.to}</span>
        </p>
        <HyroxOneToOneHeading className="mt-4 text-[clamp(1.35rem,4.8vw,2.2rem)]">
          <span className="text-[#f4d23c]">{HYROX_ONE_TO_ONE_PROOF.delta[0]}</span>
          <span className="mt-1 block text-white/75">{HYROX_ONE_TO_ONE_PROOF.delta[1]}</span>
        </HyroxOneToOneHeading>
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 sm:text-xs">
          <span className="block sm:inline">{HYROX_ONE_TO_ONE_PROOF.fromMeta}</span>
          <span className="mx-3 hidden text-[#f4d23c] sm:inline" aria-hidden>
            →
          </span>
          <span className="mt-1 block text-white/70 sm:mt-0 sm:inline">{HYROX_ONE_TO_ONE_PROOF.toMeta}</span>
        </p>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/30">
          5K {HYROX_ONE_TO_ONE_PROOF.fiveK}
        </p>
      </div>

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
