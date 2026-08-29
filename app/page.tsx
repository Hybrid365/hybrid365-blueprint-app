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
import { HomepageHumanCoaching } from "@/components/homepage/HomepageHumanCoaching";
import { HomepageBelonging } from "@/components/homepage/HomepageBelonging";
import { HomepageCoachingLevels } from "@/components/homepage/HomepageCoachingLevels";
import { HomepageFaq } from "@/components/homepage/HomepageFaq";
import { HomepageFinalCta } from "@/components/homepage/HomepageFinalCta";
import { CommunityAthleteLabAccessProvider } from "@/components/dev/community-athlete-lab/CommunityAthleteLabAccessContext";
import { isCommunityAthleteUxLabEnabled } from "@/app/lib/dev/communityAthleteUxLabAccess";
import { pickLabAccessQuery } from "@/app/lib/dev/community-athlete-lab/previewEntry";
import { readUxLabFromRequest } from "@/app/lib/dev/community-athlete-lab/previewEntry.server";

/** Query-driven lab entry on `/` must not be served from the static homepage cache. */
export const dynamic = "force-dynamic";

const HOMEPAGE_METADATA: Metadata = {
  title: {
    absolute: "Hybrid365 | Build Elite Hybrid Performance",
  },
  description:
    "Coaching for people who want to run faster, build strength, get leaner and perform. Real coaching, a real athlete platform, and a clear way to start.",
};

type HomeSearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const uxlab = await readUxLabFromRequest(params);
  if (uxlab && isCommunityAthleteUxLabEnabled()) {
    return {
      title: "Community Athlete UX Lab",
      description: "Isolated HYROX Track Community athlete mock environment. Not a public demo.",
      robots: { index: false, follow: false },
    };
  }
  return HOMEPAGE_METADATA;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const params = await searchParams;
  const uxlab = await readUxLabFromRequest(params);
  if (uxlab && isCommunityAthleteUxLabEnabled()) {
    const { CommunityAthleteLabQueryView } = await import(
      "@/components/dev/community-athlete-lab/CommunityAthleteLabQueryView"
    );
    return (
      <CommunityAthleteLabAccessProvider value={pickLabAccessQuery(params).toString()}>
        <CommunityAthleteLabQueryView uxlab={uxlab} />
      </CommunityAthleteLabAccessProvider>
    );
  }

  return (
    <div className="overflow-x-hidden bg-[#050505] text-white">
      <HomepageMotionStyles />
      <HomepageSmoothScroll />
      <HomepageNav />
      <main>
        <HomepageHero />
        <HomepageAthleteSocialProof />
        <HomepageFounderProof />
        <HomepageHybridSystem />
        <HomepageProductShowcase />
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
