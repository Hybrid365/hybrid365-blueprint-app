import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
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
  let query = supabase.from("athlete_assessments").select("*").eq("user_id", user.id);
  if (typedInstance?.id) {
    query = query.eq("programme_instance_id", typedInstance.id);
  }
  const { data: assessment } = await query.maybeSingle();

  return (
    <AssessmentClient
      programmeInstanceId={typedInstance?.id ?? null}
      initialAssessment={(assessment as AssessmentRow | null) ?? null}
    />
  );
}
