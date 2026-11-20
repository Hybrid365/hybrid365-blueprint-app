import { CANARY_ATHLETE_ID, canaryDb } from "../../app/lib/track-canary/db";
import { acceptNextWeek, completeTraining, loadCanary, saveCheckIn } from "../../app/lib/track-canary/model";

async function setClock(clock: string) {
  const db = canaryDb();
  const { data } = await db.from("track_athlete_intake").select("intake").eq("athlete_id", CANARY_ATHLETE_ID).single();
  await db.from("track_athlete_intake").update({ intake: { ...(data?.intake as object), clock } }).eq("athlete_id", CANARY_ATHLETE_ID);
}

async function weeks() {
  const db = canaryDb();
  const { data } = await db
    .from("track_calendar_sessions")
    .select("id, week_number, week_state, day_key, title, status, active")
    .eq("athlete_id", CANARY_ATHLETE_ID)
    .eq("kind", "training")
    .in("week_number", [1, 2, 3]);
  return data ?? [];
}

async function main() {
  await setClock("2026-11-23");
  const week2 = await loadCanary();
  const rows = await weeks();
  const activeWeeks = [...new Set(rows.filter((row) => row.active).map((row) => row.week_number))];
  const week1Done = rows.filter((row) => row.week_number === 1 && row.status === "completed").map((row) => row.title);
  const threshold = rows.find((row) => row.week_number === 2 && row.active && /threshold/i.test(String(row.title)));
  if (!threshold?.id) throw new Error("Week 2 threshold was not active.");
  await completeTraining({
    sessionId: String(threshold.id),
    completion: "completed",
    rpe: 7,
    feel: "expected",
    pain: false,
    actuals: { minutes: 30, note: "threshold" },
  });
  await saveCheckIn({ recovery: 8, motivation: 8, lifeStress: 3, manageable: 8, soreness: false, availability: false, travel: false, event: false });
  const beforeWeek3 = await loadCanary();
  await acceptNextWeek("recommended");
  await setClock("2026-11-30");
  const week3 = await loadCanary();
  const after = await weeks();
  const active = [...new Set(after.filter((row) => row.active).map((row) => row.week_number))];
  console.log(JSON.stringify({
    openedWeek2: week2.currentWeek,
    week2DecisionBeforeSecondSession: week2.nextWeek.decision,
    activeAfterOpen: activeWeeks,
    week1CompletedStillThere: week1Done,
    week3Recommendation: beforeWeek3.nextWeek.decision,
    week3Why: beforeWeek3.nextWeek.why,
    week3From: beforeWeek3.nextWeek.from,
    week3To: beforeWeek3.nextWeek.to,
    activeAfterWeek3: active,
    week3Tuesday: after.find((row) => row.week_number === 3 && row.active && row.day_key === "Tue")?.title,
    week2State: [...new Set(after.filter((row) => row.week_number === 2).map((row) => row.week_state))],
    week1State: [...new Set(after.filter((row) => row.week_number === 1).map((row) => row.week_state))],
    stations: week3.stations,
    finalWeek: week3.currentWeek,
    programmeWeeks: week3.programmeWeeks,
  }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "rollover failed");
  process.exit(1);
});
