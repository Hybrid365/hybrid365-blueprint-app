import type { Metadata } from "next";
import { HomepageNav } from "@/components/homepage/HomepageNav";
import { HomepageStickyCta } from "@/components/homepage/HomepageStickyCta";
import { HomepageSmoothScroll } from "@/components/homepage/HomepageSmoothScroll";
import { HomepageHero } from "@/components/homepage/HomepageHero";
import { HomepageWhy } from "@/components/homepage/HomepageWhy";
import { HomepageJourney } from "@/components/homepage/HomepageJourney";
import { HomepageMethod } from "@/components/homepage/HomepageMethod";
import { HomepageAthleteResults } from "@/components/homepage/HomepageAthleteResults";
import { HomepageTeam } from "@/components/homepage/HomepageTeam";
import { HomepageWhatYouGet } from "@/components/homepage/HomepageWhatYouGet";
import { HomepageTestimonials } from "@/components/homepage/HomepageTestimonials";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";

export const metadata: Metadata = {
  title: "Become a Faster HYROX Athlete",
  description:
    "HYROX-first performance coaching from the system behind 1:08:37 to 59:14 Pro Solo. Build your free personalised training week.",
};

export default function HomePage() {
  return (
    <div className="bg-[#050505] text-white">
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepageWhy />
        <HomepageJourney />
        <HomepageMethod />
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
