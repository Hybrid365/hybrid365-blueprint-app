/**
 * Synthetic Home D canary programme for Demo Competitive on staging ONLY.
 * Creates one published week (current calendar week) with edge-case sessions
 * plus an unpublished draft revision of the same week number (must not leak).
 *
 *   npm run staging:seed:home-d-canary            dry run
 *   npm run staging:seed:home-d-canary -- --apply
 */
import { createClient } from "@supabase/supabase-js";
import { assertStagingTarget, GuardError, loadLocalEnv, proveStagingServiceRole } from "./lib/stagingGuard.mjs";

const apply = process.argv.includes("--apply");
const DEMO_EMAIL = "demo-competitive@staging.hybrid365.local";

function mondayOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0 Sun
  const offset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + offset);
  return x;
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

const DOW = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

async function main() {
  const env = loadLocalEnv();
  assertStagingTarget(env, { needDatabase: true, needServiceRole: true });
  await proveStagingServiceRole(env);

  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: athlete, error: athErr } = await sb
    .from("hyrox_athletes")
    .select("id, name, email, current_week, current_block, programme_start_date")
    .eq("email", DEMO_EMAIL)
    .maybeSingle();
  if (athErr) throw athErr;
  if (!athlete) throw new GuardError(`Missing ${DEMO_EMAIL} — run staging:seed -- --apply first`);

  const mon = mondayOf(new Date());
  const weekStart = ymd(mon);
  const weekEnd = ymd(addDays(mon, 6));
  const today = ymd(new Date());

  /** @type {Array<{day:string, slot:string, name:string, category:string, status:string, target:string, objective:string, duration:string, completed?:boolean, feedback?:object, coachFacing?:string}>} */
  const plan = [
    {
      day: "Monday",
      slot: "Main",
      name: "Easy Aerobic Run",
      category: "Run",
      status: "completed",
      target: "5:20–5:40/km",
      objective: "Keep it conversational",
      duration: "45 min",
      completed: true,
      feedback: { rpe: 4, notes: "Felt smooth", activityType: "run" },
      coachFacing: "Stay easy — do not chase pace.",
    },
    {
      day: "Tuesday",
      slot: "Main",
      name: "Threshold Intervals",
      category: "Run",
      status: "modified",
      target: "3:50–3:55/km",
      objective: "Controlled threshold repeats",
      duration: "60 min",
      completed: true,
      feedback: {
        rpe: 7,
        notes: "Stopped one rep early",
        activityType: "run",
        modifications: "Dropped final interval",
      },
      coachFacing: "Hold threshold controlled.",
    },
    {
      day: "Tuesday",
      slot: "Optional",
      name: "Accessory Strength",
      category: "Strength",
      status: "scheduled",
      target: "RPE 6",
      objective: "Quality sets only",
      duration: "30 min",
    },
    // Wednesday intentionally empty (no-session day)
    {
      day: "Thursday",
      slot: "Main",
      name: "Ski Intervals",
      category: "Erg",
      status: "missed",
      target: "1:55–2:00/500m",
      objective: "Short hard pulls",
      duration: "40 min",
      feedback: { missedReason: "life", notes: "Work conflict" },
    },
    {
      day: "Friday",
      slot: "Main",
      name: "Hybrid Engine",
      category: "Hybrid",
      status: "scheduled",
      target: "4:10/km + stations",
      objective: "Even transitions",
      duration: "55 min",
      coachFacing: "Quality over heroics on the last run.",
    },
    {
      day: "Saturday",
      slot: "Main",
      name: "Long Easy Run",
      category: "Run",
      status: "scheduled",
      target: "5:30–5:50/km",
      objective: "Aerobic volume",
      duration: "75 min",
    },
    {
      day: "Sunday",
      slot: "Main",
      name: "Strength Capacity",
      category: "Strength",
      status: "scheduled",
      target: "Session RPE 7",
      objective: "Squat + hinge focus",
      duration: "50 min",
    },
  ];

  // Past unresolved: if Monday wasn't the only past day before today, add nothing extra.
  // If today is after Monday and we want unresolved, ensure a past scheduled session exists.
  // Monday is completed; for unresolved use a Saturday from previous week only if needed.
  // When today is Tue+, Thursday "missed" may still be future — that's fine for upcoming→missed mapping later.
  // Add an unresolved past session on a day before today if plan has no past scheduled:
  const pastScheduledNeeded = DOW.findIndex((d) => ymd(addDays(mon, DOW.indexOf(d))) < today);
  if (pastScheduledNeeded >= 0) {
    // If Monday is completed, inject unresolved on a fabricated past optional already covered.
    // Ensure at least one past `scheduled` exists for Home D "Not logged":
    const hasPastScheduled = plan.some((p) => {
      const iso = ymd(addDays(mon, DOW.indexOf(p.day)));
      return iso < today && p.status === "scheduled";
    });
    if (!hasPastScheduled && today > weekStart) {
      // Move nothing — create explicit unresolved on Monday Optional already passed
      plan.push({
        day: "Monday",
        slot: "Optional",
        name: "Mobility Flush",
        category: "Recovery",
        status: "scheduled",
        target: "Easy",
        objective: "10–15 min flush",
        duration: "15 min",
      });
    }
  }

  console.log(`Target athlete: ${athlete.name} ${athlete.id}`);
  console.log(`Week ${weekStart} → ${weekEnd} (today ${today})`);
  console.log(`Sessions planned: ${plan.length} (Wed empty)`);
  console.log(apply ? "APPLY" : "DRY RUN");

  if (!apply) return;

  // Clear prior canary weeks/drafts for this athlete week 1–2 to keep idempotent
  const { data: existingWeeks } = await sb
    .from("hyrox_programme_weeks")
    .select("id, week_number, status")
    .eq("athlete_id", athlete.id)
    .in("week_number", [1, 2]);
  for (const w of existingWeeks ?? []) {
    await sb.from("hyrox_programme_sessions").delete().eq("programme_week_id", w.id);
    await sb.from("hyrox_programme_weeks").delete().eq("id", w.id);
  }
  await sb.from("hyrox_programme_drafts").delete().eq("athlete_id", athlete.id).in("week_number", [1, 2]);

  const publishedAt = new Date().toISOString();
  const { data: week, error: weekErr } = await sb
    .from("hyrox_programme_weeks")
    .insert({
      athlete_id: athlete.id,
      block_number: 1,
      week_number: 1,
      week_start_date: weekStart,
      week_end_date: weekEnd,
      weekly_focus: "Threshold",
      coach_note: "INTERNAL — never show on athlete Home D",
      athlete_facing_note: "Hold threshold controlled this week. Quality over heroics.",
      weekly_summary: { role: "Threshold", whyMatters: "Build controlled threshold without junk volume." },
      status: "published",
      published_at: publishedAt,
    })
    .select("*")
    .single();
  if (weekErr) throw weekErr;

  const sessionRows = plan.map((p) => ({
    programme_week_id: week.id,
    athlete_id: athlete.id,
    day_of_week: p.day,
    session_slot: p.slot,
    session_name: p.name,
    category: p.category,
    prescription: {
      objective: p.objective,
      duration: p.duration,
      targetPace: p.target,
      coachNote: p.coachFacing || "",
      athleteFacingNote: p.coachFacing || "",
      editConfig: {
        objective: p.objective,
        duration: p.duration,
        targetPace: p.target,
        coachNote: p.coachFacing || "",
        athleteFacingNote: p.coachFacing || "",
      },
    },
    metadata: {
      duration: p.duration,
      focus: p.objective,
      intent: p.objective,
      coachNote: p.coachFacing || "",
    },
    status: p.status,
    completed_at: p.completed ? publishedAt : null,
    athlete_feedback: p.feedback ?? null,
  }));

  const { error: sessErr } = await sb.from("hyrox_programme_sessions").insert(sessionRows);
  if (sessErr) throw sessErr;

  // Unpublished draft revision of Week 1 — must not appear on Home D
  const { error: draftErr } = await sb.from("hyrox_programme_drafts").insert({
    athlete_id: athlete.id,
    block_number: 1,
    week_number: 1,
    draft_data: {
      leakProbe: true,
      days: [
        {
          day: "Tuesday",
          sessions: [
            {
              session_name: "DRAFT LEAK Threshold · Stage 9",
              category: "Run",
              editConfig: { targetPace: "9:99/km", coachNote: "DRAFT INTERNAL" },
            },
          ],
        },
      ],
    },
    coach_note: "DRAFT INTERNAL coach note — must never leak",
    athlete_facing_note: "DRAFT athlete note — must never leak while unpublished",
    status: "edited",
  });
  if (draftErr) throw draftErr;

  await sb
    .from("hyrox_athletes")
    .update({
      current_week: 1,
      current_block: 1,
      programme_status: "published",
      programme_start_date: weekStart,
      status: "programme_published",
      race_name: "HYROX Birmingham (staging)",
      race_date: "2026-12-12",
      target_time: "1:05:00",
    })
    .eq("id", athlete.id);

  console.log("published_week", week.id);
  console.log("sessions", sessionRows.length);
  console.log("unpublished_draft_week_1", true);
  console.log("demo_competitive_id", athlete.id);
}

main().catch((e) => {
  console.error("Failed:", e.message || e);
  process.exit(1);
});
