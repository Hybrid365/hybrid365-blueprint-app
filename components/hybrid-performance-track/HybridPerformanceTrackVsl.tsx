import { HYBRID_PERFORMANCE_TRACK_VSL } from "@/app/lib/hybrid-performance-track/hybridPerformanceTrackStory";
import { HybridPerformanceVslPlayer } from "@/components/hybrid-performance/HybridPerformanceVsl";

export function HybridPerformanceTrackVsl() {
  const copy = HYBRID_PERFORMANCE_TRACK_VSL;

  return (
    <section id={copy.id} className="scroll-mt-[72px] bg-[#050505] px-4 pb-6 pt-1 sm:px-6 sm:pb-7 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c] sm:text-[11px]">
            {copy.eyebrow}
          </p>
          <h2 className="font-black uppercase leading-[0.9] tracking-[-0.045em] text-white text-[clamp(1.35rem,4.2vw,2.05rem)]">
            {copy.headline.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-[12px] leading-snug text-white/48 sm:text-[13px]">
            {copy.supporting}
          </p>
        </div>
        <div className="mt-4 sm:mt-5">
          <HybridPerformanceVslPlayer title="The Hybrid365 approach" />
        </div>
      </div>
    </section>
  );
}
