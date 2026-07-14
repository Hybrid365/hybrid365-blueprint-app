import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageAthletesStrip } from "@/components/homepage/HomepageAthletesStrip";
import { HomepageProof } from "@/components/homepage/HomepageProof";
import { HomepageIdentity } from "@/components/homepage/HomepageIdentity";
import { HomepageMethod } from "@/components/homepage/HomepageMethod";
import { HomepageProduct } from "@/components/homepage/HomepageProduct";
import { HomepageHowItWorks } from "@/components/homepage/HomepageHowItWorks";
import { HomepageTeam } from "@/components/homepage/HomepageTeam";
import { HomepageTestimonials } from "@/components/homepage/HomepageTestimonials";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";

export const metadata: Metadata = {
  title: "Hybrid365 — Refuse Average | High-Performance Hybrid Coaching",
  description:
    "Run fast. Lift heavy. Look athletic. Perform better. A high-performance brand for athletes who refuse average — structure, community and coaching that matches your work ethic.",
};

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepageAthletesStrip />
        <HomepageProof />
        <HomepageIdentity />
        <HomepageMethod />
        <HomepageProduct />
        <HomepageHowItWorks />
        <HomepageTeam />
        <HomepageTestimonials />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
