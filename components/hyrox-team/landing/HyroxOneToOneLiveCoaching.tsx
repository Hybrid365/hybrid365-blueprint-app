"use client";

import {
  HYROX_ONE_TO_ONE_LIVE_COACHING,
  HYROX_ONE_TO_ONE_VIDEOS,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";
import { useHyroxOneToOneInView } from "./useHyroxOneToOneInView";

export function HyroxOneToOneLiveCoaching() {
  const { ref, inView } = useHyroxOneToOneInView("480px");

  return (
    <HyroxOneToOneSection id="live-coaching" variant="default">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_LIVE_COACHING.eyebrow}</HyroxOneToOneEyebrow>
          <HyroxOneToOneHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
            {HYROX_ONE_TO_ONE_LIVE_COACHING.headline[0]}
            <span className="block text-[#f4d23c]">
              {HYROX_ONE_TO_ONE_LIVE_COACHING.headline[1]}
            </span>
          </HyroxOneToOneHeading>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
            {HYROX_ONE_TO_ONE_LIVE_COACHING.body}
          </p>

          <ul className="mt-8 space-y-5">
            {HYROX_ONE_TO_ONE_LIVE_COACHING.points.map((point) => (
              <li key={point.title}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#f4d23c]">
                  {point.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/70 sm:text-[15px]">
                  {point.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div ref={ref} className="flex justify-center lg:justify-end">
          <div className="h-[min(70vh,640px)] w-[min(100%,calc(min(70vh,640px)*9/16))] overflow-hidden rounded-2xl border border-white/10 bg-black lg:h-[min(78vh,720px)] lg:w-[min(100%,calc(min(78vh,720px)*9/16))]">
            {inView ? (
              <video
                className="h-full w-full bg-black object-contain"
                src={HYROX_ONE_TO_ONE_VIDEOS.liveCoaching.src}
                width={HYROX_ONE_TO_ONE_VIDEOS.liveCoaching.width}
                height={HYROX_ONE_TO_ONE_VIDEOS.liveCoaching.height}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                aria-label={HYROX_ONE_TO_ONE_VIDEOS.liveCoaching.label}
              />
            ) : (
              <div
                className="flex h-full w-full items-end bg-[#0a0a0a] p-5"
                aria-hidden
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/35">
                  Live coaching
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </HyroxOneToOneSection>
  );
}
