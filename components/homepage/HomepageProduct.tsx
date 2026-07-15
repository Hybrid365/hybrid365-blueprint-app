"use client";

import { useCallback, useEffect, useRef } from "react";
import { COACHING_GALLERY, COACHING_SYSTEM_COPY } from "@/app/lib/homepage/coachingSystem";
import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { HomepagePhoneVisual } from "./HomepagePhoneVisual";
import {
  HomepageSection,
  HomepageEyebrow,
  HomepageHeading,
  PrimaryCta,
  homepageCtaClass,
} from "./homepageUi";

const PHONE_DISPLAY_WIDTH = 260;

export function HomepageProduct() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-gallery-card]");
    const delta = card ? card.offsetWidth + 24 : 280;
    el.scrollBy({ left: dir * delta, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement) && document.activeElement !== el) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByDir(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByDir(-1);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [scrollByDir]);

  return (
    <HomepageSection id="system" variant="default" className="!py-20 sm:!py-24">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HomepageEyebrow>{COACHING_SYSTEM_COPY.eyebrow}</HomepageEyebrow>
        <HomepageHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {COACHING_SYSTEM_COPY.headline[0]}
          <span className="block text-[#f4d23c]">{COACHING_SYSTEM_COPY.headline[1]}</span>
        </HomepageHeading>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/55">
          {COACHING_SYSTEM_COPY.body}
        </p>
      </div>

      <div className="relative mt-10 sm:mt-12">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 lg:hidden">
            Swipe screens →
          </p>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Previous screens"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Next screens"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-white/30 hover:bg-white/[0.08]"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          tabIndex={0}
          role="region"
          aria-label="Coaching system screens"
          className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-4 snap-x snap-mandatory outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-6 lg:mx-0 lg:px-0"
        >
          {COACHING_GALLERY.map((item, index) => {
            const screen = getPhoneScreen(item.screenId);
            return (
              <article
                key={item.id}
                data-gallery-card
                className="w-[min(78vw,280px)] shrink-0 snap-center sm:w-[min(42vw,280px)] lg:w-[min(30vw,280px)]"
              >
                <HomepagePhoneVisual
                  screen={screen}
                  displayWidth={PHONE_DISPLAY_WIDTH}
                  priority={index < 2}
                  className="mx-auto"
                />
                <div className="mt-5 text-center sm:text-left">
                  <h3 className="text-sm font-black uppercase tracking-wide text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/50 sm:text-[13px]">
                    {item.caption}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-10 flex justify-center lg:justify-start">
        <PrimaryCta
          href={COACHING_SYSTEM_COPY.ctaHref}
          size="large"
          className={homepageCtaClass}
        >
          {COACHING_SYSTEM_COPY.ctaLabel}
        </PrimaryCta>
      </div>
    </HomepageSection>
  );
}
