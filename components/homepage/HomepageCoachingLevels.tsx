import { LANDING_COACHING_LEVELS } from "@/app/lib/homepage/landingStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
  SecondaryCta,
  homepageCtaClass,
} from "./homepageUi";

export function HomepageCoachingLevels() {
  return (
    <HomepageSection id="coaching" variant="default" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_COACHING_LEVELS.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.15rem)]">
          {LANDING_COACHING_LEVELS.headline}
        </HomepageHeading>
        <p className="mt-4 max-w-xl text-sm text-white/50">{LANDING_COACHING_LEVELS.reassurance}</p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
        {LANDING_COACHING_LEVELS.tracks.map((track) => (
          <article key={track.id}>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
              {track.eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
              {track.title}
            </h3>
            <ul className="mt-5 space-y-2 text-sm text-white/60">
              {track.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="mt-7">
              <SecondaryCta href={track.href} className={homepageCtaClass}>
                {track.cta}
              </SecondaryCta>
            </div>
          </article>
        ))}
      </div>
    </HomepageSection>
  );
}
