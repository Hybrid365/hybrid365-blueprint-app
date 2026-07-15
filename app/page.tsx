import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageMotionStyles } from "@/components/homepage/HomepageMotion";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepagePeopleWhoRefuseAverage } from "@/components/homepage/HomepagePeopleWhoRefuseAverage";
import { HomepageChooseTrack } from "@/components/homepage/HomepageChooseTrack";
import { HomepageScreeningFlow } from "@/components/homepage/HomepageScreeningFlow";
import { HomepageProduct } from "@/components/homepage/HomepageProduct";
import { HomepageAccountability } from "@/components/homepage/HomepageAccountability";
import { HomepageHowItWorks } from "@/components/homepage/HomepageHowItWorks";
import { HomepageTestimonials } from "@/components/homepage/HomepageTestimonials";
import { HomepageFreeWeekBreakdown } from "@/components/homepage/HomepageFreeWeekBreakdown";
import { HomepagePerformancePromise } from "@/components/homepage/HomepagePerformancePromise";
import { HomepageFaq } from "@/components/homepage/HomepageFaq";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";

export const metadata: Metadata = {
  title: "Hybrid365 — Refuse Average | Personalised Hybrid Coaching",
  description:
    "You already have the work ethic. Hybrid365 gives that effort a system — personalised coaching, structured programming, data-led decisions and daily accountability.",
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
        <HomepageScreeningFlow />
        <HomepageProduct />
        <HomepageAccountability />
        <HomepageHowItWorks />
        <HomepageTestimonials />
        <HomepageFreeWeekBreakdown />
        <HomepagePerformancePromise />
        <HomepageFaq />
        <HomepageFinalCta />
      </main>
      <HomepageStickyCta />
    </div>
  );
}
