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
          @keyframes homepage-sparkline-draw {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes homepage-ecosystem-enter {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes homepage-ecosystem-phone-enter {
            from { opacity: 0; transform: translateY(14px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes homepage-ecosystem-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes homepage-ecosystem-float-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes homepage-ecosystem-connector-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes homepage-ecosystem-sparkline-draw {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
          .homepage-marquee-track {
            animation: homepage-marquee 36s linear infinite;
          }
          .homepage-sparkline-draw {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: homepage-sparkline-draw 1.8s ease-out forwards;
          }
          .homepage-ecosystem-phone-enter {
            animation: homepage-ecosystem-phone-enter 0.7s ease-out both;
          }
          .homepage-ecosystem-card-enter {
            animation: homepage-ecosystem-enter 0.55s ease-out both;
          }
          .homepage-ecosystem-float {
            animation: homepage-ecosystem-float 7s ease-in-out infinite;
          }
          .homepage-ecosystem-float-slow {
            animation: homepage-ecosystem-float-slow 8s ease-in-out infinite;
          }
          .homepage-ecosystem-connector {
            opacity: 0;
            animation: homepage-ecosystem-connector-fade 0.8s ease-out forwards;
          }
          .homepage-ecosystem-sparkline {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
            animation: homepage-ecosystem-sparkline-draw 1.6s ease-out 0.6s forwards;
          }
          @media (prefers-reduced-motion: reduce) {
            .homepage-marquee-track {
              animation: none;
            }
            .homepage-sparkline-draw,
            .homepage-ecosystem-sparkline {
              animation: none;
              stroke-dashoffset: 0;
            }
            .homepage-ecosystem-phone-enter,
            .homepage-ecosystem-card-enter {
              animation: none;
            }
            .homepage-ecosystem-float,
            .homepage-ecosystem-float-slow {
              animation: none;
            }
            .homepage-ecosystem-connector {
              animation: none;
              opacity: 1;
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
