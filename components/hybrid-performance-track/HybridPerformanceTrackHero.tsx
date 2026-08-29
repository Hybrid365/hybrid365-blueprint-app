import {
  getHybridPerformanceTrackJoinUrl,
  HYBRID_PERFORMANCE_TRACK_HERO,
} from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "@/components/homepage/HomepagePhoneVisual";
import { AttributedLink } from "@/components/start/AttributedLink";
import { TrackJoinCta } from "@/components/hybrid-performance-track/TrackJoinCta";
import { homepageCtaClass } from "@/components/homepage/homepageUi";

export function HybridPerformanceTrackHero() {
  const h = HYBRID_PERFORMANCE_TRACK_HERO;
  const screen = getPhoneScreen("programme");

  return (
    <section className="relative overflow-hidden bg-[#050505] pt-[56px] sm:pt-[64px]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-8 sm:px-6 sm:py-10 md:grid-cols-[1.05fr_0.95fr] md:gap-10 lg:px-8 lg:py-12">
        <div className="relative z-10 max-w-xl lg:max-w-none">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c] sm:text-[11px]">
            {h.eyebrow}
          </p>
          <h1 className="font-black uppercase leading-[0.84] tracking-[-0.055em] text-white text-[clamp(2.05rem,6.8vw,4.25rem)]">
            {h.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-4 max-w-[28rem] text-[13px] font-medium leading-snug text-white/52 sm:mt-5 sm:text-[14px]">
            {h.supporting}
          </p>
          <div className="mt-6 flex flex-col items-start gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-5">
            <TrackJoinCta href={getHybridPerformanceTrackJoinUrl()} className={homepageCtaClass}>
              {h.primaryCta}
            </TrackJoinCta>
            <AttributedLink
              href={h.secondaryHref}
              className="inline-flex items-center py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38 transition hover:text-white/60"
            >
              {h.secondaryCta}
            </AttributedLink>
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/32">
            {h.price}
            <span className="mx-2 text-white/18">·</span>
            {h.membershipNote}
          </p>
        </div>

        <div className="flex justify-center px-8 md:justify-end md:px-0">
          <div className="w-[min(58vw,240px)] md:w-[min(38vw,280px)] lg:w-[300px]">
            <HomepagePhoneVisual screen={screen} displayWidth={300} fillContainer priority />
          </div>
        </div>
      </div>
    </section>
  );
}
