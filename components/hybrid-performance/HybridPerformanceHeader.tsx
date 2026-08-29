import Link from "next/link";
import { HYBRID_PERFORMANCE_APPLY_HREF } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { AttributedLink } from "@/components/start/AttributedLink";

export function HybridPerformanceHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-[#050505]/90 backdrop-blur-md">
      <div className="mx-auto flex h-[56px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-[64px] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-[13px] font-black uppercase tracking-[0.18em] text-white sm:text-sm"
        >
          Hybrid365
        </Link>
        <AttributedLink
          href={HYBRID_PERFORMANCE_APPLY_HREF}
          className="inline-flex min-h-[34px] items-center justify-center rounded-md border border-[#f4d23c] px-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#f4d23c]/10 sm:min-h-[38px] sm:px-4 sm:text-[11px]"
        >
          Apply for 1-1 coaching
        </AttributedLink>
      </div>
    </header>
  );
}
