import {
  getHybridPerformanceTrackJoinUrl,
  HYBRID_PERFORMANCE_TRACK_COMPARE,
} from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import {
  HomepageEyebrow,
  HomepageHeading,
  HomepageSection,
  homepageCtaClass,
} from "@/components/homepage/homepageUi";
import { AttributedLink } from "@/components/start/AttributedLink";
import { TrackJoinCta } from "@/components/hybrid-performance-track/TrackJoinCta";

export function HybridPerformanceTrackCompare() {
  const copy = HYBRID_PERFORMANCE_TRACK_COMPARE;

  return (
    <HomepageSection id="compare" variant="default" className="border-b-0 !py-12 !pb-28 sm:!py-16 sm:!pb-20">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{copy.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,6vw,3.1rem)]">
          {copy.headline}
        </HomepageHeading>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.08] lg:grid-cols-2">
        <article className="bg-[#080808] px-6 py-8 sm:px-8">
          <h3 className="text-[clamp(1.2rem,3vw,1.55rem)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white">
            {copy.track.title}
          </h3>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f4d23c]">
            {copy.track.bestIf}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/55">
            {copy.track.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-8">
            <TrackJoinCta href={getHybridPerformanceTrackJoinUrl()} className={homepageCtaClass}>
              {copy.track.cta}
            </TrackJoinCta>
          </div>
        </article>

        <article className="bg-[#050505] px-6 py-8 sm:px-8">
          <h3 className="text-[clamp(1.2rem,3vw,1.55rem)] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white">
            {copy.oneToOne.title}
          </h3>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">
            {copy.oneToOne.bestIf}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/55">
            {copy.oneToOne.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-8">
            <AttributedLink
              href={copy.oneToOne.href}
              className={`${homepageCtaClass} inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/18 px-7 text-[13px] font-black uppercase tracking-[0.1em] text-white transition hover:border-[#f4d23c]/50 hover:bg-white/[0.04] sm:min-h-[52px]`}
            >
              {copy.oneToOne.cta}
            </AttributedLink>
          </div>
        </article>
      </div>
    </HomepageSection>
  );
}
