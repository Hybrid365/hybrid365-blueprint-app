"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CHASE_TRACKS,
  TRACK_CHASE_COPY,
  type ChaseTrack,
  type ChaseTrackId,
} from "@/app/lib/homepage/chaseTracks";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
} from "./homepageUi";

function ChaseTrackCard({
  track,
  selected,
  onSelect,
}: {
  track: ChaseTrack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={cn(
        "relative flex min-h-[420px] w-[min(86vw,340px)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] border transition duration-300 sm:min-h-[460px] lg:w-auto",
        selected
          ? "border-[#f4d23c] shadow-[0_0_0_1px_rgba(244,210,60,0.35)]"
          : "border-white/10 hover:border-white/25"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 z-10 cursor-pointer"
        aria-pressed={selected}
        aria-label={`Select ${track.title}`}
      />
      <Image
        src={track.imageSrc}
        alt={track.imageAlt}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 86vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/25" />

      <div className="relative z-20 mt-auto flex flex-col p-6 sm:p-7">
        {selected ? (
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
            Your current priority
          </p>
        ) : null}
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
          Track {track.number}
        </span>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/60">
          {track.title}
        </p>
        <h3 className="mt-3 text-[1.35rem] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white sm:text-[1.5rem]">
          {track.identity}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-white/65">{track.description}</p>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {track.highlights.map((item) => (
            <li
              key={item}
              className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/75 backdrop-blur-sm"
            >
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs leading-relaxed text-white/45">{track.personalisation}</p>

        <Link
          href={track.href}
          className="relative z-30 mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#f4d23c] px-5 text-center text-xs font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935]"
        >
          {track.ctaLabel}
        </Link>
      </div>
    </article>
  );
}

export function HomepageChooseTrack() {
  const [selected, setSelected] = useState<ChaseTrackId | null>(null);
  const active = CHASE_TRACKS.find((t) => t.id === selected);

  return (
    <HomepageSection id="tracks" variant="dark" className="!py-20 sm:!py-24">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{TRACK_CHASE_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(2rem,5.5vw,3.25rem)]">
          {TRACK_CHASE_COPY.headline}
        </HomepageHeading>
        <p className="mt-5 text-base leading-relaxed text-white/55">
          {TRACK_CHASE_COPY.body}
        </p>
        <p className="mt-3 text-sm font-medium text-[#f4d23c]/80">
          {TRACK_CHASE_COPY.reassurance}
        </p>
      </div>

      <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
        Swipe tracks →
      </p>

      <div className="mt-4 -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-12 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
        {CHASE_TRACKS.map((track) => (
          <ChaseTrackCard
            key={track.id}
            track={track}
            selected={selected === track.id}
            onSelect={() => setSelected(track.id)}
          />
        ))}
      </div>

      <p className="mt-6 min-h-[1.5rem] text-center text-sm text-white/50 lg:text-left">
        {active ? active.selectedMessage : "Same standard. Different programmes."}
      </p>
    </HomepageSection>
  );
}
