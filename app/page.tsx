import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageProof } from "@/components/homepage/HomepageProof";
import { HomepageWhy } from "@/components/homepage/HomepageWhy";
import { HomepageStandard } from "@/components/homepage/HomepageStandard";
import { HomepageMethod } from "@/components/homepage/HomepageMethod";
import { HomepageProduct } from "@/components/homepage/HomepageProduct";
import { HomepageJourney } from "@/components/homepage/HomepageJourney";
import { HomepageCulture } from "@/components/homepage/HomepageCulture";
import { HomepageAthleteResults } from "@/components/homepage/HomepageAthleteResults";
import { HomepageTeam } from "@/components/homepage/HomepageTeam";
import { HomepageWhatYouGet } from "@/components/homepage/HomepageWhatYouGet";
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
        <HomepageProof />
        <HomepageWhy />
        <HomepageStandard />
        <HomepageMethod />
        <HomepageProduct />
        <HomepageJourney />
        <HomepageCulture />
        <HomepageAthleteResults />
        <HomepageTeam />
        <HomepageWhatYouGet />
        <HomepageTestimonials />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
