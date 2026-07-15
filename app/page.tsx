import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepagePeopleWhoRefuseAverage } from "@/components/homepage/HomepagePeopleWhoRefuseAverage";
import { HomepageChooseTrack } from "@/components/homepage/HomepageChooseTrack";
import { HomepageProduct } from "@/components/homepage/HomepageProduct";
import { HomepagePersonalisedFromDayOne } from "@/components/homepage/HomepagePersonalisedFromDayOne";
import { HomepageFaq } from "@/components/homepage/HomepageFaq";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";

export const metadata: Metadata = {
  title: "Hybrid365 — Refuse Average | Personalised Hybrid Coaching",
  description:
    "You already have the work ethic. Hybrid365 gives that effort a system — personalised coaching, structured programming and daily accountability.",
};

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepagePeopleWhoRefuseAverage />
        <HomepageChooseTrack />
        <HomepageProduct />
        <HomepagePersonalisedFromDayOne />
        <HomepageFaq />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
