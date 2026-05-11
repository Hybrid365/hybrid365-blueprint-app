import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { hasMeaningfulPlanJson } from "@/app/lib/programmePlan";
import AssessmentClient, { type AssessmentRow } from "./AssessmentClient";

type ProgrammeInstanceRow = {
  id: string;
};

export default async function AssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/assessment");
  }

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  let hasGeneratedProgramme = false;
  if (typedInstance?.id) {
    const { data: weekRows } = await supabase
      .from("programme_weeks")
      .select("plan_json")
      .eq("programme_instance_id", typedInstance.id)
      .limit(12);
    hasGeneratedProgramme = (weekRows ?? []).some((w) =>
      hasMeaningfulPlanJson((w as { plan_json?: unknown }).plan_json)
    );
  }

  const { data: assessment } = await supabase
    .from("athlete_assessments")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <AssessmentClient
      programmeInstanceId={typedInstance?.id ?? null}
      initialAssessment={(assessment as AssessmentRow | null) ?? null}
      hasGeneratedProgramme={hasGeneratedProgramme}
    />
  );
}
