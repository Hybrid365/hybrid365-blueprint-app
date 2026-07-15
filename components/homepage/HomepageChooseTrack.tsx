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
  const className = "h-7 w-7 text-[#f4d23c]";
  switch (id) {
    case "hyrox-specific":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 17l4-10h2l4 10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 12h5" strokeLinecap="round" />
          <path d="M15 7v10" strokeLinecap="round" />
          <path d="M15 7h3.2a2.3 2.3 0 010 4.6H15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "strong-fit-fast":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M7 8v8M17 8v8M7 12h10" strokeLinecap="round" />
          <path d="M4.5 9.5v5M19.5 9.5v5" strokeLinecap="round" />
        </svg>
      );
    case "run-performance":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="14.5" cy="5.5" r="1.6" />
          <path
            d="M10 21l2-5 3 2 2-6M8 13l3-1 2 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "personalised":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="3" />
          <path d="M5.5 19c1.3-3.2 3.6-4.8 6.5-4.8s5.2 1.6 6.5 4.8" strokeLinecap="round" />
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
      className="group relative flex min-h-[340px] w-[min(86vw,340px)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-[#0a0a0a] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition duration-500 hover:-translate-y-1.5 hover:border-[#f4d23c]/35 hover:shadow-[0_28px_70px_rgba(0,0,0,0.5)] sm:min-h-[380px] sm:w-auto sm:p-8"
    >
      <div
        className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[#f4d23c]/[0.07] blur-3xl transition duration-500 group-hover:bg-[#f4d23c]/[0.12]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#f4d23c]/[0.04] to-transparent opacity-80"
        aria-hidden
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#f4d23c]/30 bg-[#f4d23c]/[0.08]">
            <TrackIcon id={track.id} />
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
            Track {track.number}
          </span>
        </div>

        <h3 className="mt-8 text-[1.35rem] font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-[1.55rem]">
          {track.title}
        </h3>

        {track.points?.length ? (
          <ul className="mt-4 space-y-1.5">
            {track.points.map((point) => (
              <li
                key={point}
                className="text-sm font-semibold leading-snug text-white/70 sm:text-[15px]"
              >
                {point}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-[15px] sm:leading-relaxed">
          {track.description}
        </p>
      </div>

      <p className="relative mt-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#f4d23c] transition duration-300 group-hover:gap-3">
        {track.ctaLabel}
        <span aria-hidden>→</span>
      </p>
    </Link>
  );
}

export function HomepageChooseTrack() {
  return (
    <HomepageSection id="tracks" variant="dark" className="!py-24 sm:!py-28 lg:!py-32">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{TRACK_SELECTOR_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(2rem,5.5vw,3.5rem)]">
          {TRACK_SELECTOR_COPY.headline}
        </HomepageHeading>
        <p className="mt-6 text-base leading-relaxed text-white/55 sm:text-lg">
          {TRACK_SELECTOR_COPY.body}
        </p>
      </div>

      <div className="mt-14 -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-16 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:overflow-visible lg:px-0 xl:grid-cols-4 xl:gap-5">
        {HOMEPAGE_TRACKS.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
    </HomepageSection>
  );
}
