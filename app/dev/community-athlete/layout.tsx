import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isCommunityAthleteUxLabEnabled } from "@/app/lib/dev/communityAthleteUxLabAccess";
import { CommunityAthleteLabBanner } from "@/components/dev/community-athlete-lab/CommunityAthleteLabBanner";
import { CommunityAthleteLabShell } from "@/components/dev/community-athlete-lab/CommunityAthleteLabShell";

export const metadata: Metadata = {
  title: "Community Athlete UX Lab",
  description: "Isolated HYROX Track Community athlete mock environment. Not a public demo.",
  robots: { index: false, follow: false },
};

export default function CommunityAthleteLabLayout({ children }: { children: React.ReactNode }) {
  if (!isCommunityAthleteUxLabEnabled()) {
    notFound();
  }

  return (
    <CommunityAthleteLabShell>
      <CommunityAthleteLabBanner />
      {children}
    </CommunityAthleteLabShell>
  );
}
