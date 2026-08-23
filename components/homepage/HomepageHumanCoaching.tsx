import { LANDING_HUMAN_COACHING } from "@/app/lib/homepage/landingStory";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";
import { HomepageLazyVideo } from "./HomepageLazyVideo";

export function HomepageHumanCoaching() {
  return (
    <HomepageSection id="coaching-live" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_HUMAN_COACHING.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.9rem,6.5vw,3.25rem)]">
          {LANDING_HUMAN_COACHING.headline}
        </HomepageHeading>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {LANDING_HUMAN_COACHING.body}
        </p>
      </div>

      <div className="mx-auto mt-8 h-[min(72vh,640px)] w-[min(100%,calc(min(72vh,640px)*9/16))] overflow-hidden rounded-[1.5rem] lg:mx-0 lg:h-[min(78vh,720px)] lg:w-[min(100%,calc(min(78vh,720px)*9/16))]">
        <HomepageLazyVideo videoKey="liveCoaching" className="h-full w-full" fit="contain" controls />
      </div>
    </HomepageSection>
  );
}
