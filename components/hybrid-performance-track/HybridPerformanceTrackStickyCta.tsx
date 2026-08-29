"use client";

import { useEffect, useState } from "react";
import {
  getHybridPerformanceTrackJoinUrl,
  HYBRID_PERFORMANCE_TRACK_STICKY,
} from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import { TrackJoinCta } from "@/components/hybrid-performance-track/TrackJoinCta";

function PointIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[#f4d23c]" aria-hidden>
        <path
          fill="currentColor"
          d="M4 5.5h12v1.5H4zm0 3.75h12V11H4zm0 3.75h8V14.8H4z"
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

export function HybridPerformanceTrackStickyCta() {
  const copy = HYBRID_PERFORMANCE_TRACK_STICKY;
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
          <TrackJoinCta
            href={getHybridPerformanceTrackJoinUrl()}
            className="min-h-[46px] w-full px-6 text-[12px] lg:min-w-[220px]"
          >
            {copy.primaryCta}
          </TrackJoinCta>
          <p className="mt-1 hidden text-center text-[10px] text-white/35 lg:block">
            {copy.supporting}
          </p>
        </div>
      </div>
    </div>
  );
}
