"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  HYROX_ONE_TO_ONE_GALLERY,
  HYROX_ONE_TO_ONE_SYSTEM,
  type HyroxOneToOneGalleryItem,
} from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "@/components/homepage/HomepagePhoneVisual";
import { cn } from "@/lib/utils";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

function PlatformSlide({
  slide,
  priority,
}: {
  slide: HyroxOneToOneGalleryItem;
  priority?: boolean;
}) {
  const screen = getPhoneScreen(slide.screenId);

  return (
    <article className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#f4d23c]">
          {slide.eyebrow}
        </p>
        <h3 className="mt-2 text-[clamp(1.65rem,5vw,2.5rem)] font-black uppercase leading-[0.92] tracking-tight text-white">
          {slide.title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">{slide.caption}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-white/50">
          {slide.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="flex justify-center px-6 py-3 lg:justify-end lg:px-0 lg:py-0">
        <div className="w-[min(74vw,280px)] lg:w-[340px]">
          <HomepagePhoneVisual
            screen={screen}
            displayWidth={340}
            fillContainer
            priority={priority}
          />
        </div>
      </div>
    </article>
  );
}

export function HyroxOneToOneSystemGallery() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = HYROX_ONE_TO_ONE_GALLERY;

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-platform-slide]")];
    const mid = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let best = Number.POSITIVE_INFINITY;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < best) {
        best = dist;
        closest = i;
      }
    });
    setIndex(closest);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", syncIndex, { passive: true });
    return () => el.removeEventListener("scroll", syncIndex);
  }, [syncIndex]);

  const goTo = (next: number) => {
    const el = scrollerRef.current;
    const card = el?.querySelectorAll<HTMLElement>("[data-platform-slide]")[next];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <HyroxOneToOneSection id="platform" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_SYSTEM.eyebrow}</HyroxOneToOneEyebrow>
        <HyroxOneToOneHeading className="text-[clamp(1.7rem,5.5vw,2.75rem)]">
          {HYROX_ONE_TO_ONE_SYSTEM.headline}
          <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_SYSTEM.highlight}</span>
        </HyroxOneToOneHeading>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {HYROX_ONE_TO_ONE_SYSTEM.body}
        </p>
      </div>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="HYROX Team coaching platform"
        className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] outline-none [&::-webkit-scrollbar]:hidden lg:mx-0 lg:mt-12 lg:px-0"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            data-platform-slide
            className="w-[min(92vw,720px)] shrink-0 snap-center lg:w-full lg:min-w-full"
          >
            <PlatformSlide slide={slide} priority={i === 0} />
          </div>
        ))}
      </div>

      <div className="mt-6 hidden items-center justify-center gap-3 sm:flex">
        <button
          type="button"
          aria-label="Previous platform slide"
          onClick={() => goTo(Math.max(0, index - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
        >
          ←
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Platform slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={slide.title}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition",
                index === i ? "w-7 bg-[#f4d23c]" : "w-2 bg-white/25"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next platform slide"
          onClick={() => goTo(Math.min(slides.length - 1, index + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
        >
          →
        </button>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 sm:hidden" role="tablist" aria-label="Platform slides">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === i}
            aria-label={slide.title}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 rounded-full transition",
              index === i ? "w-7 bg-[#f4d23c]" : "w-2 bg-white/25"
            )}
          />
        ))}
      </div>
    </HyroxOneToOneSection>
  );
}
