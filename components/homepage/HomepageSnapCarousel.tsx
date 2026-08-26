"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HomepageSnapCarousel({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode[];
  ariaLabel: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = children.length;

  const syncIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-snap-card]")];
    if (!cards.length) return;
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
    if (!el) return;
    const card = el.querySelectorAll<HTMLElement>("[data-snap-card]")[next];
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className={className}>
      <div
        ref={scrollerRef}
        tabIndex={0}
        role="region"
        aria-label={ariaLabel}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] outline-none [&::-webkit-scrollbar]:hidden sm:gap-5 lg:mx-0 lg:px-0"
      >
        {children.map((child, i) => (
          <div
            key={i}
            data-snap-card
            className="w-[min(86vw,340px)] shrink-0 snap-center lg:w-auto lg:min-w-0 lg:flex-1"
          >
            {child}
          </div>
        ))}
      </div>

      {count > 1 ? (
        <div className="mt-5 flex items-center justify-center gap-2 lg:hidden" role="tablist" aria-label="Slides">
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={index === i}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition",
                index === i ? "w-6 bg-[#f4d23c]" : "w-2 bg-white/25"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
