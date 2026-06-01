import { getDashboardSession } from "@/app/lib/dashboardAuth";
import { loadCommunityProgrammeContext } from "@/app/lib/communityProgrammeStatus";
import AssessmentClient, { type AssessmentRow } from "./AssessmentClient";

export default async function AssessmentPage() {
  const { supabase, user } = await getDashboardSession("/dashboard/assessment");

  const programmeCtx = await loadCommunityProgrammeContext(supabase, user.id);

  const { data: assessment } = await supabase
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AssessmentClient
      programmeInstanceId={programmeCtx.instance?.id ?? null}
      initialAssessment={(assessment as AssessmentRow | null) ?? null}
      hasGeneratedProgramme={programmeCtx.programmeGenerated}
      canViewProgramme={programmeCtx.canViewProgramme}
      programmePendingUnlock={programmeCtx.programmePendingUnlock}
      unlockAtMs={programmeCtx.unlock.unlockAtMs}
    />
  );
}
