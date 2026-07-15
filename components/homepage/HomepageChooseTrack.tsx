"use client";

import { useState } from "react";
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

function HyroxMetricVisual() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050505]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#f4d23c"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${0.72 * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white">72</span>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Ready</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
              <span>Run</span>
              <span className="text-[#4ade80]">68%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[68%] rounded-full bg-[#4ade80]" />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/40">
              <span>Stations</span>
              <span className="text-[#60a5fa]">61%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[61%] rounded-full bg-[#60a5fa]" />
            </div>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 200 36" className="mt-3 h-9 w-full" aria-hidden>
        <polyline
          fill="none"
          stroke="#f4d23c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="4,30 40,26 76,22 112,18 148,12 184,6"
        />
        <circle cx="184" cy="6" r="3" fill="#f4d23c" />
      </svg>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white/35">
        Race progression
      </p>
    </div>
  );
}

function RunMetricVisual() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050505]/80 p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">Current PB</p>
          <p className="mt-0.5 text-lg font-black text-white/50">22:40</p>
        </div>
        <span className="mb-1 text-[#f4d23c]" aria-hidden>
          →
        </span>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#f4d23c]/70">Target</p>
          <p className="mt-0.5 text-lg font-black text-[#f4d23c]">19:30</p>
        </div>
      </div>
      <svg viewBox="0 0 200 48" className="mt-3 h-12 w-full" aria-hidden>
        <defs>
          <linearGradient id="runFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,40 L28,36 L56,34 L84,28 L112,24 L140,18 L168,14 L200,8 L200,48 L0,48 Z"
          fill="url(#runFill)"
        />
        <polyline
          fill="none"
          stroke="#4ade80"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="0,40 28,36 56,34 84,28 112,24 140,18 168,14 200,8"
        />
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-white/35">
        <span>Threshold volume</span>
        <span>Weekly mileage ↑</span>
      </div>
    </div>
  );
}

function HybridMetricVisual() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050505]/80 p-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Strength", value: 78, color: "#f97316" },
          { label: "Engine", value: 64, color: "#4ade80" },
          { label: "Physique", value: 71, color: "#60a5fa" },
        ].map((item) => (
          <div key={item.label} className="text-center">
            <div className="mx-auto flex h-14 w-10 items-end justify-center rounded-md bg-white/[0.04] px-1 pb-1">
              <div
                className="w-full rounded-sm"
                style={{ height: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-wider text-white/45">
              {item.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Run</p>
          <p className="text-xs font-black text-white">2–3×</p>
        </div>
        <div className="flex-1 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">Lift</p>
          <p className="text-xs font-black text-white">3–4×</p>
        </div>
      </div>
    </div>
  );
}

function TrackMetricVisual({ id }: { id: ChaseTrackId }) {
  if (id === "hyrox") return <HyroxMetricVisual />;
  if (id === "run") return <RunMetricVisual />;
  return <HybridMetricVisual />;
}

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
        "relative flex w-[min(86vw,320px)] shrink-0 snap-start flex-col overflow-hidden rounded-[1.5rem] border bg-gradient-to-b from-[#121212] to-[#080808] p-6 transition duration-300 sm:p-7 lg:w-auto lg:min-h-full",
        selected
          ? "border-[#f4d23c] shadow-[0_0_32px_rgba(244,210,60,0.12)]"
          : "border-[#f4d23c]/25 hover:border-[#f4d23c]/45 hover:shadow-[0_0_24px_rgba(244,210,60,0.06)]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 z-10 cursor-pointer"
        aria-pressed={selected}
        aria-label={`Select ${track.title}`}
      />

      {selected ? (
        <p className="relative z-20 mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
          Your current priority
        </p>
      ) : null}

      <div className="relative z-20 flex items-start justify-between gap-3">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]/70">
          Track {track.number}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          {track.title}
        </span>
      </div>

      <h3 className="relative z-20 mt-4 text-[1.3rem] font-black uppercase leading-[0.98] tracking-[-0.03em] text-white sm:text-[1.4rem]">
        {track.identity}
      </h3>

      <div className="relative z-20 mt-5">
        <TrackMetricVisual id={track.id} />
      </div>

      <ul className="relative z-20 mt-5 flex flex-wrap gap-1.5">
        {track.highlights.map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/70"
          >
            {item}
          </li>
        ))}
      </ul>

      <p className="relative z-20 mt-4 text-xs leading-relaxed text-white/45">
        {track.personalisation}
      </p>

      <div className="relative z-20 mt-auto pt-6">
        <Link
          href={track.href}
          className="relative z-30 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#f4d23c] px-5 text-center text-xs font-black uppercase tracking-wide text-[#050505] transition hover:bg-[#e8c935]"
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

      <div className="mt-4 -mx-4 flex items-stretch gap-4 overflow-x-auto px-4 pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-12 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
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
        {active ? active.selectedMessage : null}
      </p>
    </HomepageSection>
  );
}
