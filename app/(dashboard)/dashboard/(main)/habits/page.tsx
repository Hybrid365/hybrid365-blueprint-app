import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import HabitsClient from "./HabitsClient";

type ProgrammeInstanceRow = { id: string };

export default async function HabitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/habits");
  }

  const { data: instance } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const typedInstance = instance as ProgrammeInstanceRow | null;

  return <HabitsClient programmeInstanceId={typedInstance?.id ?? null} />;
}
