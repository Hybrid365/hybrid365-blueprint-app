import Link from "next/link";
import {
  getHybridPerformanceTrackJoinUrl,
  HYBRID_PERFORMANCE_TRACK_HERO,
} from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import { TrackJoinCta } from "@/components/hybrid-performance-track/TrackJoinCta";

export function HybridPerformanceTrackHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-[64px] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-[13px] font-black uppercase tracking-[0.18em] text-white sm:text-sm"
        >
          Hybrid365
        </Link>
        <TrackJoinCta
          href={getHybridPerformanceTrackJoinUrl()}
          className="min-h-[34px] px-3.5 text-[10px] sm:min-h-[38px] sm:px-4 sm:text-[11px]"
        >
          {HYBRID_PERFORMANCE_TRACK_HERO.primaryCta}
        </TrackJoinCta>
      </div>
    </header>
  );
}
