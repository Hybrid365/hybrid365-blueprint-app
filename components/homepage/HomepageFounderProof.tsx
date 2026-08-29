import Image from "next/image";
import { LANDING_FOUNDER } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";

export function HomepageFounderProof() {
  return (
    <HomepageSection id="founder" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_FOUNDER.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {LANDING_FOUNDER.headline[0]}
          <span className="mt-2 block text-[clamp(1.15rem,3.6vw,1.85rem)] font-black tracking-[-0.04em] text-white/80">
            {LANDING_FOUNDER.headline[1]}
          </span>
        </HomepageHeading>
      </div>

      <p className="mt-8 text-center text-[clamp(2.4rem,11vw,5rem)] font-black leading-none tracking-[-0.05em] text-white lg:text-left">
        <span className="text-white/35">{LANDING_FOUNDER.fromWeight}</span>
        <span className="mx-2 text-[#f4d23c]" aria-hidden>
          →
        </span>
        <span>{LANDING_FOUNDER.toWeight}</span>
      </p>
      <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 lg:text-left">
        {LANDING_FOUNDER.fiveKLabel} {LANDING_FOUNDER.fiveK}
        <span className="mx-3 text-white/20">·</span>
        {LANDING_FOUNDER.to} {LANDING_FOUNDER.event}
      </p>

      <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-[1.15rem] sm:grid-cols-4 sm:rounded-[1.5rem]">
        {LANDING_FOUNDER.photos.map((photo) => (
          <figure key={photo.src} className="relative aspect-[3/4] bg-[#111]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className={photo.imageClassName}
              sizes="(max-width: 640px) 50vw, 25vw"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 pb-2 pt-8 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-white/85 sm:px-2 sm:text-[11px]">
              {photo.label}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-3 text-center text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-left">
        <p>{LANDING_FOUNDER.intro}</p>
        {LANDING_FOUNDER.body.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </HomepageSection>
  );
}
