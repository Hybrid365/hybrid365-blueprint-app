"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return true;
}

export function HomepageMotionStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes homepage-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .homepage-marquee-track {
            animation: homepage-marquee 36s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .homepage-marquee-track {
              animation: none;
            }
          }
        `,
      }}
    />
  );
}

export function HomepageHorizontalScroll({
  children,
  className,
  itemClassName,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <div
      className={cn(
        "-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scrollbar-none sm:-mx-0 sm:px-0",
        "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

export function HomepageProofMarquee({
  items,
}: {
  items: readonly { value: string; label: string }[];
}) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer
  );

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-white/10 bg-black/30 py-4">
      {prefersReducedMotion ? (
        <div className="homepage-marquee-track flex w-max gap-10">
          {doubled.map((item, i) => (
            <div key={`${item.label}-${i}`} className="flex shrink-0 items-baseline gap-2 px-2">
              <span className="text-lg font-black tabular-nums text-white sm:text-xl">
                {item.value}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-baseline gap-2">
              <span className="text-lg font-black tabular-nums text-white">{item.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
