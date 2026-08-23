import Image from "next/image";
import { LANDING_BELONGING } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";
import { HomepageLazyVideo } from "./HomepageLazyVideo";

export function HomepageBelonging() {
  return (
    <HomepageSection id="team" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_BELONGING.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.8rem,6vw,3.1rem)]">
          {LANDING_BELONGING.headline[0]}
          <span className="block text-[#f4d23c]">{LANDING_BELONGING.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {LANDING_BELONGING.body}
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[1.5rem]">
        <HomepageLazyVideo
          videoKey="cinematicTraining"
          className="aspect-[16/10] w-full sm:aspect-video"
          fit="cover"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LANDING_BELONGING.photos.map((photo) => (
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

      <p className="mt-6 text-center lg:text-left">
        <a
          href={LANDING_BELONGING.telegramHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center text-xs font-bold uppercase tracking-[0.12em] text-white/40 transition hover:text-white/70"
        >
          {LANDING_BELONGING.telegramLabel} →
        </a>
      </p>
    </HomepageSection>
  );
}
