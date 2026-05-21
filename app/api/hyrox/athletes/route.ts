import { NextResponse } from "next/server";
import { requireHyroxCoachApi } from "@/app/lib/hyroxApiAuth";
import { listHyroxAthletes } from "@/app/lib/hyroxAthleteCoachDb";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import type { HyroxAthleteListItem } from "@/app/lib/hyroxDatabaseTypes";

/** Coach list — all hyrox_athletes (no status filter), newest first */
export async function GET() {
  const auth = await requireHyroxCoachApi();
  if (auth.error) return auth.error;

  const { client: supabase, mode } = await createCoachServerClient();
  const { athletes: rows, error } = await listHyroxAthletes(supabase);

  if (error) {
    console.error("Hyrox athletes list failed", { message: error, coachSupabaseMode: mode });
    return NextResponse.json(
      {
        success: false,
        error,
        athletes: [] as HyroxAthleteListItem[],
        live: false,
        count: 0,
      },
      { status: 500 }
    );
  }

  const athletes: HyroxAthleteListItem[] = await Promise.all(
    rows.map(async (row) => {
      const flags = await fetchAthleteProgressFlags(supabase, row.id);
      const [{ count: raceCount }, { count: publishedWeekCount }] = await Promise.all([
        supabase
          .from("hyrox_race_results")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", row.id),
        supabase
          .from("hyrox_programme_weeks")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", row.id)
          .eq("status", "published"),
      ]);
      const weeks = publishedWeekCount ?? 0;
      return {
        ...row,
        ...flags,
        hasRaceResult: (raceCount ?? 0) > 0,
        userLinked: Boolean(row.user_id),
        publishedWeekCount: weeks,
        programmeLive: weeks > 0,
      };
    })
  );

  if (process.env.NODE_ENV === "development") {
    console.log("Accepted athletes loaded", athletes.length, athletes);
  }

  let warning: string | undefined;
  if (athletes.length === 0 && mode === "session") {
    warning =
      "No athletes returned. Ensure profiles.role is coach/admin in Supabase, or set SUPABASE_SERVICE_ROLE_KEY for server-side coach reads.";
  }

  return NextResponse.json({
    success: true,
    live: true,
    athletes,
    count: athletes.length,
    coachSupabaseMode: mode,
    ...(warning ? { warning } : {}),
  });
}
