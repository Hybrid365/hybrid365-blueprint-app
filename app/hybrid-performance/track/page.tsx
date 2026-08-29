import type { Metadata } from "next";
import { HybridPerformanceTrackCompare } from "@/components/hybrid-performance-track/HybridPerformanceTrackCompare";
import { HybridPerformanceTrackFinalCta } from "@/components/hybrid-performance-track/HybridPerformanceTrackFinalCta";
import { HybridPerformanceTrackHeader } from "@/components/hybrid-performance-track/HybridPerformanceTrackHeader";
import { HybridPerformanceTrackHero } from "@/components/hybrid-performance-track/HybridPerformanceTrackHero";
import { HybridPerformanceTrackHow } from "@/components/hybrid-performance-track/HybridPerformanceTrackHow";
import { HybridPerformanceTrackIdentity } from "@/components/hybrid-performance-track/HybridPerformanceTrackIdentity";
import { HybridPerformanceTrackIncluded } from "@/components/hybrid-performance-track/HybridPerformanceTrackIncluded";
import { HybridPerformanceTrackPlatform } from "@/components/hybrid-performance-track/HybridPerformanceTrackPlatform";
import { HybridPerformanceTrackResults } from "@/components/hybrid-performance-track/HybridPerformanceTrackResults";
import { HybridPerformanceTrackStickyCta } from "@/components/hybrid-performance-track/HybridPerformanceTrackStickyCta";
import { HybridPerformanceTrackTrain } from "@/components/hybrid-performance-track/HybridPerformanceTrackTrain";
import { HybridPerformanceTrackVsl } from "@/components/hybrid-performance-track/HybridPerformanceTrackVsl";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";

export const metadata: Metadata = {
  title: {
    absolute: "Hybrid365 | Hybrid Performance Track",
  },
  description:
    "Structured hybrid training with clear progression, testing and performance targets — delivered through the Hybrid365 platform. £39.99/month.",
};

export default function HybridPerformanceTrackPage() {
  return (
    <div className="overflow-x-hidden bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HybridPerformanceTrackHeader />
      <main className="pb-20 lg:pb-24">
        <HybridPerformanceTrackHero />
        <HybridPerformanceTrackVsl />
        <HybridPerformanceTrackResults />
        <HybridPerformanceTrackHow />
        <HybridPerformanceTrackTrain />
        <HybridPerformanceTrackPlatform />
        <HybridPerformanceTrackIncluded />
        <HybridPerformanceTrackCompare />
        <HybridPerformanceTrackIdentity />
        <HybridPerformanceTrackFinalCta />
      </main>
      <HybridPerformanceTrackStickyCta />
    </div>
  );
}
