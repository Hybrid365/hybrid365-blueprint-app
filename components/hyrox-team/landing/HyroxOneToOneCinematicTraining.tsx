"use client";

import { useEffect, useRef } from "react";
import {
  HYROX_ONE_TO_ONE_CINEMATIC,
  HYROX_ONE_TO_ONE_VIDEOS,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
} from "./hyroxOneToOneLandingUi";
import { useHyroxOneToOneInView, usePrefersReducedMotion } from "./useHyroxOneToOneInView";

export function HyroxOneToOneCinematicTraining() {
  const { ref, inView } = useHyroxOneToOneInView("320px");
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldLoad = inView;
  const shouldAutoplay = shouldLoad && !reducedMotion;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAutoplay) return;
    const play = () => {
      void video.play().catch(() => {
        /* Autoplay may be blocked — overlay copy remains the fallback. */
      });
    };
    play();
    video.addEventListener("loadeddata", play);
    return () => video.removeEventListener("loadeddata", play);
  }, [shouldAutoplay]);

  return (
    <section
      id="team-training"
      aria-labelledby="team-training-heading"
      className="scroll-mt-[72px] bg-[#050505]"
    >
      <div ref={ref} className="relative aspect-[16/10] min-h-[280px] overflow-hidden bg-black sm:aspect-video sm:min-h-0">
        {shouldLoad ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={HYROX_ONE_TO_ONE_VIDEOS.cinematicTraining.src}
            width={HYROX_ONE_TO_ONE_VIDEOS.cinematicTraining.width}
            height={HYROX_ONE_TO_ONE_VIDEOS.cinematicTraining.height}
            muted
            loop
            playsInline
            autoPlay={shouldAutoplay}
            preload="metadata"
            disablePictureInPicture
            aria-label={HYROX_ONE_TO_ONE_VIDEOS.cinematicTraining.label}
          />
        ) : (
          <div className="absolute inset-0 bg-[#080808]" aria-hidden />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-[1200px]">
            <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_CINEMATIC.eyebrow}</HyroxOneToOneEyebrow>
            <HyroxOneToOneHeading
              id="team-training-heading"
              className="max-w-xl text-[clamp(1.55rem,5vw,2.85rem)]"
            >
              {HYROX_ONE_TO_ONE_CINEMATIC.headline[0]}
              <span className="block text-[#f4d23c]">
                {HYROX_ONE_TO_ONE_CINEMATIC.headline[1]}
              </span>
            </HyroxOneToOneHeading>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              {HYROX_ONE_TO_ONE_CINEMATIC.body}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
