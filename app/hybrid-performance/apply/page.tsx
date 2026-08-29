import type { Metadata } from "next";
import Link from "next/link";
import OneToOneApplyFormSection from "@/app/one-to-one-coaching/apply/OneToOneApplyFormSection";
import { HYBRID_PERFORMANCE_APPLY_PAGE } from "@/app/lib/hybrid-performance/hybridPerformanceStory";
import { HybridPerformanceHeader } from "@/components/hybrid-performance/HybridPerformanceHeader";

export const metadata: Metadata = {
  title: "Apply | Hybrid365 Hybrid Performance 1-1",
  description:
    "Apply for Hybrid365 Hybrid Performance 1-1 coaching — individual programming, weekly check-ins and athlete dashboard access.",
};

export default function HybridPerformanceApplyPage() {
  const copy = HYBRID_PERFORMANCE_APPLY_PAGE;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <HybridPerformanceHeader />
      <section className="px-5 pb-8 pt-24 md:px-8 md:pt-28">
        <div className="mx-auto max-w-3xl">
          <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
            {copy.eyebrow}
          </p>

          <h1 className="mb-6 text-4xl font-black uppercase leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            {copy.headline[0]}
            <br />
            {copy.headline[1]}
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            {copy.body}
          </p>

          <p className="text-sm text-white/50">
            <Link href={copy.backHref} className="text-[#f4d23c] hover:underline">
              {copy.backLabel}
            </Link>
          </p>
        </div>
      </section>

      <OneToOneApplyFormSection
        overviewHref="/hybrid-performance"
        overviewLabel="Back to Hybrid Performance"
        productName="Hybrid365 Hybrid Performance 1-1"
      />
    </main>
  );
}
