import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageMeetTheTeam } from "@/components/homepage/HomepageMeetTheTeam";
import { HomepageChooseTrack } from "@/components/homepage/HomepageChooseTrack";
import { HomepageProduct } from "@/components/homepage/HomepageProduct";
import { HomepageHowItWorks } from "@/components/homepage/HomepageHowItWorks";
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
        <HomepageMeetTheTeam />
        <HomepageChooseTrack />
        <HomepageProduct />
        <HomepageHowItWorks />
        <HomepageTestimonials />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
