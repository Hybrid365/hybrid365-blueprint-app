"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LANDING_PRODUCT_SHOWCASE, type ProductShowcaseSlide } from "@/app/lib/homepage/landingStory";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepageEyebrow, HomepageHeading, HomepageSection } from "./homepageUi";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import { cn } from "@/lib/utils";

function ProductSlide({
  slide,
  priority,
}: {
  slide: ProductShowcaseSlide;
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
          {slide.headline}
        </h3>
        <ul className="mt-4 space-y-1.5 text-sm text-white/50">
          {slide.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {slide.overlay ? (
          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
              {slide.overlay.kicker}
            </p>
            <p className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
              {slide.overlay.title}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#f4d23c] sm:text-3xl">
              {slide.overlay.value}
            </p>
            <p className="mt-2 max-w-xs text-xs text-white/40">{slide.overlay.note}</p>
          </div>
        ) : null}
      </div>

      <div className="flex justify-center lg:justify-end">
        <HomepagePhoneVisual
          screen={screen}
          displayWidth={340}
          priority={priority}
          className="w-[min(78vw,340px)] max-w-[340px]"
        />
      </div>
    </article>
  );
}

export function HomepageProductShowcase() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = LANDING_PRODUCT_SHOWCASE.slides;

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-product-slide]")];
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
    const card = el?.querySelectorAll<HTMLElement>("[data-product-slide]")[next];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <HomepageSection id="product" variant="dark" className="border-b-0 !py-12 sm:!py-16">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
        <HomepageEyebrow>{LANDING_PRODUCT_SHOWCASE.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.7rem,5.5vw,2.75rem)]">
          {LANDING_PRODUCT_SHOWCASE.headline}
        </HomepageHeading>
      </div>

      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label="Athlete platform showcase"
        className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] outline-none [&::-webkit-scrollbar]:hidden lg:mx-0 lg:mt-12 lg:px-0"
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            data-product-slide
            className="w-[min(92vw,720px)] shrink-0 snap-center lg:w-full lg:min-w-full"
          >
            <ProductSlide slide={slide} priority={i === 0} />
          </div>
        ))}
      </div>

      <div className="mt-6 hidden items-center justify-center gap-3 sm:flex">
        <button
          type="button"
          aria-label="Previous product slide"
          onClick={() => goTo(Math.max(0, index - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
        >
          ←
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Product slides">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={slide.headline}
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
          aria-label="Next product slide"
          onClick={() => goTo(Math.min(slides.length - 1, index + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white"
        >
          →
        </button>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 sm:hidden" role="tablist" aria-label="Product slides">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={index === i}
            aria-label={slide.headline}
            onClick={() => goTo(i)}
            className={cn(
              "h-2 rounded-full transition",
              index === i ? "w-7 bg-[#f4d23c]" : "w-2 bg-white/25"
            )}
          />
        ))}
      </div>
    </HomepageSection>
  );
}
