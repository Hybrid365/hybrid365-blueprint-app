/**
 * Local / admin-only seed script.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose this in client code or commit it.
 * Writes directly to programme_instances and programme_weeks for manual paid-dashboard testing.
 * Month-1 entitlement model: weeks 1-4 unlocked, weeks 5-12 locked.
 * Does not call /api/generate, Airtable, or Kit.
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import type { PlanJson } from "../app/lib/sessionLibrary";

function tryLoadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][\w]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v;
}

function scheduleSessionCount(plan: PlanJson): number {
  const s = plan.schedule;
  if (!Array.isArray(s)) return 0;
  return s.filter(
    (day) => typeof day?.time_cap_minutes === "number" && day.time_cap_minutes > 0
  ).length;
}

async function main() {
  tryLoadEnvLocal();

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const userId = requireEnv("SEED_USER_ID");

  const generatedWeeks = generate12WeekProgramme({
    first_name: "Kieran",
    email: "test@hybrid365.local",
    days_per_week: 6,
    weekly_hours_band: "7-10",
    goal_focus: "hybrid",
    ability_level: "advanced",
    double_sessions: true,
    equipment: ["Full gym"],
    five_k_time: "17:00",
    preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    notes: "competitive hyrox",
  });

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const instancePayload = {
    user_id: userId,
    title: "Hybrid365 12-Week Programme",
    current_week: 1,
    goal_focus: "hybrid",
    ability_level: "advanced",
    weekly_hours_band: "7-10",
  };

  const { data: existing, error: existingErr } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingErr) {
    console.error("programme_instances select error:", existingErr.message);
    process.exit(1);
  }

  let programmeInstanceId: string;

  if (existing?.id) {
    programmeInstanceId = existing.id;
    const { error: updateErr } = await supabase
      .from("programme_instances")
      .update({
        title: instancePayload.title,
        current_week: instancePayload.current_week,
        goal_focus: instancePayload.goal_focus,
        ability_level: instancePayload.ability_level,
        weekly_hours_band: instancePayload.weekly_hours_band,
      })
      .eq("id", programmeInstanceId);
    if (updateErr) {
      console.error("programme_instances update error:", updateErr.message);
      process.exit(1);
    }
  } else {
    const { data: inserted, error: insertErr } = await supabase
      .from("programme_instances")
      .insert(instancePayload)
      .select("id")
      .single();
    if (insertErr || !inserted?.id) {
      console.error(
        "programme_instances insert error:",
        insertErr?.message ?? "no id returned"
      );
      process.exit(1);
    }
    programmeInstanceId = inserted.id;
  }

  const weekRows = generatedWeeks.map((week) => ({
    programme_instance_id: programmeInstanceId,
    week_number: week.week_number,
    title: week.title,
    is_unlocked: week.week_number <= 4,
    plan_json: week.plan_json,
  }));

  const { error: upsertErr } = await supabase
    .from("programme_weeks")
    .upsert(weekRows, { onConflict: "programme_instance_id,week_number" });

  if (upsertErr) {
    console.error("programme_weeks upsert error:", upsertErr.message);
    process.exit(1);
  }

  console.log("programme_instance id:", programmeInstanceId);
  for (const week of generatedWeeks) {
    console.log(
      `week ${week.week_number}: ${week.title} | sessions=${scheduleSessionCount(
        week.plan_json
      )} | unlocked=${week.week_number <= 4 ? "yes" : "no"} | stress=${
        week.plan_json.weekly_stress?.label ?? "n/a"
      } | relative_load=${week.plan_json.weekly_stress?.relative_load ?? "n/a"}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
