import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageAthleteSocialProof } from "@/components/homepage/HomepageAthleteSocialProof";
import { HomepageHybridSystem } from "@/components/homepage/HomepageHybridSystem";
import { HomepageProductShowcase } from "@/components/homepage/HomepageProductShowcase";
import { HomepageFounderProof } from "@/components/homepage/HomepageFounderProof";
import { HomepageClientResults } from "@/components/homepage/HomepageClientResults";
import { HomepageHumanCoaching } from "@/components/homepage/HomepageHumanCoaching";
import { HomepageBelonging } from "@/components/homepage/HomepageBelonging";
import { HomepageCoachingLevels } from "@/components/homepage/HomepageCoachingLevels";
import { HomepageFaq } from "@/components/homepage/HomepageFaq";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";

export const metadata: Metadata = {
  title: "Hybrid365 — Become a Better Hybrid Athlete",
  description:
    "Personalised HYROX training built around your ability, goals and performance data. Real coaching, a real athlete platform, and a clear way to start.",
};

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepageAthleteSocialProof />
        <HomepageHybridSystem />
        <HomepageProductShowcase />
        <HomepageFounderProof />
        <HomepageClientResults />
        <HomepageHumanCoaching />
        <HomepageBelonging />
        <HomepageCoachingLevels />
        <HomepageFaq />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
