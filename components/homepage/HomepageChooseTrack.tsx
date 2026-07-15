import Link from "next/link";
import {
  HOMEPAGE_TRACKS,
  TRACK_SELECTOR_COPY,
  type HomepageTrack,
} from "@/app/lib/homepage/coachingTracks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

function TrackIcon({ id }: { id: HomepageTrack["id"] }) {
  const className = "h-6 w-6 text-[#f4d23c]";
  switch (id) {
    case "hyrox-team":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.9L12 14.3 7.7 16.5l.8-4.9L5 8.2l4.8-.7L12 3z" />
        </svg>
      );
    case "hybrid-performance":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 16l4-8 4 5 3-4 5 7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" strokeLinecap="round" />
        </svg>
      );
    case "community":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="16" cy="10" r="2" />
          <path d="M4.5 18c.8-2.4 2.7-3.5 4.5-3.5s3.7 1.1 4.5 3.5" strokeLinecap="round" />
          <path d="M13 18c.5-1.6 1.7-2.5 3-2.5s2.3.7 2.8 2" strokeLinecap="round" />
        </svg>
      );
    case "one-to-one":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="8" r="3" />
          <path d="M6 19c1.2-3 3.2-4.5 6-4.5s4.8 1.5 6 4.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function TrackCard({ track }: { track: HomepageTrack }) {
  return (
    <Link
      href={track.href}
      className="group flex min-h-[280px] w-[min(82vw,300px)] shrink-0 snap-start flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#f4d23c]/35 hover:bg-white/[0.06] sm:w-auto"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#f4d23c]/25 bg-[#f4d23c]/[0.07]">
            <TrackIcon id={track.id} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
            {track.accent}
          </span>
        </div>
        <h3 className="mt-6 text-xl font-black uppercase tracking-[-0.03em] text-white">
          {track.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/55">{track.description}</p>
      </div>
      <p className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c] transition group-hover:gap-3">
        {track.ctaLabel}
        <span aria-hidden>→</span>
      </p>
    </Link>
  );
}

export function HomepageChooseTrack() {
  return (
    <HomepageSection id="tracks" variant="accent" className="!py-20 sm:!py-24 lg:!py-28">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{TRACK_SELECTOR_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3.25rem)]">
          {TRACK_SELECTOR_COPY.headline}
        </HomepageHeading>
        <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-white/55 sm:text-lg">
          {TRACK_SELECTOR_COPY.body}
        </p>
      </div>

      <div className="mt-12 -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-14 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0">
        {HOMEPAGE_TRACKS.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </HomepageSection>
  );
}
