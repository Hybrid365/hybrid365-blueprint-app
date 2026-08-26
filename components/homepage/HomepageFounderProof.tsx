import Image from "next/image";
import { FOUNDER_TRANSFORM } from "@/app/lib/homepage/peopleWhoRefuseAverage";
import { LANDING_FOUNDER } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";

export function HomepageFounderProof() {
  return (
    <HomepageSection id="founder" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_FOUNDER.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {LANDING_FOUNDER.headline}
        </HomepageHeading>
        <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-white/40">
          {LANDING_FOUNDER.subhead}
        </p>
      </div>

      <p className="mt-8 text-center text-[clamp(2.4rem,11vw,5rem)] font-black leading-none tracking-[-0.05em] text-white lg:text-left">
        <span className="text-white/35">{LANDING_FOUNDER.from}</span>
        <span className="mx-2 text-[#f4d23c]" aria-hidden>
          →
        </span>
        <span>{LANDING_FOUNDER.to}</span>
      </p>
      <p className="mt-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 lg:text-left">
        {LANDING_FOUNDER.event}
        <span className="mx-3 text-white/20">·</span>
        {LANDING_FOUNDER.fiveKLabel} {LANDING_FOUNDER.fiveK}
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

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-white/55 lg:mx-0 lg:text-left">
        {LANDING_FOUNDER.body}
      </p>
    </HomepageSection>
  );
}
