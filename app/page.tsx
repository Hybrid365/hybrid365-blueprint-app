import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageWhy } from "@/components/homepage/HomepageWhy";
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
  title: "Hybrid Performance Coaching | Hybrid365",
  description:
    "Run fast. Lift heavy. Look athletic. Perform better. High-performance hybrid coaching with structure, standards and a proven HYROX edge. Start your free training week.",
};

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepageWhy />
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
