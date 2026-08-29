"use client";

import { useEffect, useState } from "react";
import { HYBRID_PERFORMANCE_STICKY } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { AttributedLink } from "@/components/start/AttributedLink";

function PointIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#f4d23c]" aria-hidden>
        <path
          fill="currentColor"
          d="M10 2.2a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM4.4 16.6c.4-3.1 2.7-5 5.6-5s5.2 1.9 5.6 5H4.4z"
        />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#f4d23c]" aria-hidden>
        <path
          fill="currentColor"
          d="M3.5 15.2 9 4.8h2l5.5 10.4h-2.2L12.8 12H7.2L5.7 15.2H3.5zM10 6.8 8 10.6h4L10 6.8z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#f4d23c]" aria-hidden>
      <path
        fill="currentColor"
        d="M10 2.5 12 8h5.5L13 11.5l1.8 6L10 14.4 5.2 17.5 7 11.5 2.5 8H8z"
      />
    </svg>
  );
}

export function HybridPerformanceStickyCta() {
  const copy = HYBRID_PERFORMANCE_STICKY;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050505]/96 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      role="region"
      aria-label="Quick action"
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <ul className="hidden min-w-0 flex-1 items-center gap-8 lg:flex">
          {copy.points.map((point, index) => (
            <li key={point.title} className="flex min-w-0 items-start gap-2.5">
              <PointIcon index={index} />
              <p className="min-w-0">
                <span className="block text-[11px] font-black uppercase tracking-wide text-white">
                  {point.title}
                </span>
                <span className="block text-[11px] text-white/45">{point.body}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="flex w-full flex-col items-stretch lg:w-auto">
          <AttributedLink
            href={copy.primaryHref}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-md bg-[#f4d23c] px-6 text-[12px] font-black uppercase tracking-[0.1em] text-[#050505] transition hover:bg-[#e8c935] lg:min-w-[168px]"
          >
            {copy.primaryCta}
          </AttributedLink>
          <p className="mt-1 hidden text-center text-[10px] text-white/35 lg:block">
            {copy.supporting}
          </p>
        </div>
      </div>
    </div>
  );
}
