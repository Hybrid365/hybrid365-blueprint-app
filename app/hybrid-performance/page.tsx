import type { Metadata } from "next";
import { HybridPerformanceAthleteSlider } from "@/components/hybrid-performance/HybridPerformanceAthleteSlider";
import { HybridPerformanceFinalCta } from "@/components/hybrid-performance/HybridPerformanceFinalCta";
import { HybridPerformanceFounder } from "@/components/hybrid-performance/HybridPerformanceFounder";
import { HybridPerformanceHeader } from "@/components/hybrid-performance/HybridPerformanceHeader";
import { HybridPerformanceHero } from "@/components/hybrid-performance/HybridPerformanceHero";
import { HybridPerformanceIdentity } from "@/components/hybrid-performance/HybridPerformanceIdentity";
import { HybridPerformanceIncluded } from "@/components/hybrid-performance/HybridPerformanceIncluded";
import { HybridPerformancePlatform } from "@/components/hybrid-performance/HybridPerformancePlatform";
import { HybridPerformanceStickyCta } from "@/components/hybrid-performance/HybridPerformanceStickyCta";
import { HybridPerformanceSystem } from "@/components/hybrid-performance/HybridPerformanceSystem";
import { HybridPerformanceVsl } from "@/components/hybrid-performance/HybridPerformanceVsl";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";

export const metadata: Metadata = {
  title: {
    absolute: "Hybrid365 | Hybrid Performance 1-1",
  },
  description:
    "1-1 hybrid performance coaching for people who refuse average. Look strong. Run fast. Perform.",
};

export default function HybridPerformancePage() {
  return (
    <div className="overflow-x-hidden bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HybridPerformanceHeader />
      <main className="pb-20 lg:pb-24">
        <HybridPerformanceHero />
        <HybridPerformanceVsl />
        <HybridPerformanceAthleteSlider />
        <HybridPerformanceFounder />
        <HybridPerformanceSystem />
        <HybridPerformancePlatform />
        <HybridPerformanceIncluded />
        <HybridPerformanceIdentity />
        <HybridPerformanceFinalCta />
      </main>
      <HybridPerformanceStickyCta />
    </div>
  );
}
