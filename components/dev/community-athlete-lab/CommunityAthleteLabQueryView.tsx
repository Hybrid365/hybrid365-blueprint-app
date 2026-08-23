import { notFound } from "next/navigation";
import { isCommunityAthleteUxLabEnabled } from "@/app/lib/dev/communityAthleteUxLabAccess";
import { CommunityAthleteLabBanner } from "@/components/dev/community-athlete-lab/CommunityAthleteLabBanner";
import { CommunityAthleteLabCheckIn } from "@/components/dev/community-athlete-lab/CommunityAthleteLabCheckIn";
import { CommunityAthleteLabHabits } from "@/components/dev/community-athlete-lab/CommunityAthleteLabHabits";
import { CommunityAthleteLabHome } from "@/components/dev/community-athlete-lab/CommunityAthleteLabHome";
import { CommunityAthleteLabProgramme } from "@/components/dev/community-athlete-lab/CommunityAthleteLabProgramme";
import { CommunityAthleteLabProgress } from "@/components/dev/community-athlete-lab/CommunityAthleteLabProgress";
import { CommunityAthleteLabShell } from "@/components/dev/community-athlete-lab/CommunityAthleteLabShell";
import { CommunityAthleteLabTesting } from "@/components/dev/community-athlete-lab/CommunityAthleteLabTesting";
import { normalizeUxLabQuery } from "@/app/lib/dev/community-athlete-lab/previewEntry";

export function CommunityAthleteLabQueryView({ uxlab }: { uxlab: string }) {
  if (!isCommunityAthleteUxLabEnabled()) {
    notFound();
  }

  const screen = normalizeUxLabQuery(uxlab);

  return (
    <CommunityAthleteLabShell>
      <div data-community-athlete-ux-lab="true" hidden>
        Community Athlete UX Lab
      </div>
      <CommunityAthleteLabBanner />
      {screen === "programme" ? (
        <CommunityAthleteLabProgramme />
      ) : screen === "progress" ? (
        <CommunityAthleteLabProgress />
      ) : screen === "habits" ? (
        <CommunityAthleteLabHabits />
      ) : screen === "check-in" ? (
        <CommunityAthleteLabCheckIn />
      ) : screen === "testing" ? (
        <CommunityAthleteLabTesting />
      ) : (
        <CommunityAthleteLabHome />
      )}
    </CommunityAthleteLabShell>
  );
}
