/**
 * Local / admin-only seed script.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose this in client code or commit it.
 * Writes directly to programme_instances and programme_weeks for manual dashboard testing.
 * Does not call /api/generate, Airtable, or Kit.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { buildWeekBlueprint } from "../app/lib/buildWeekBlueprint";
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

tryLoadEnvLocal();

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
  return s.filter((day) => typeof day?.time_cap_minutes === "number" && day.time_cap_minutes > 0)
    .length;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const userId = requireEnv("SEED_USER_ID");

  const planJson = buildWeekBlueprint({
    first_name: "Kieran",
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

  const { data: existing, error: selErr } = await supabase
    .from("programme_instances")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) {
    console.error("programme_instances select error:", selErr.message);
    process.exit(1);
  }

  let instanceId: string;

  if (existing?.id) {
    instanceId = existing.id;
    const { error: upErr } = await supabase
      .from("programme_instances")
      .update({
        title: instancePayload.title,
        current_week: instancePayload.current_week,
        goal_focus: instancePayload.goal_focus,
        ability_level: instancePayload.ability_level,
        weekly_hours_band: instancePayload.weekly_hours_band,
      })
      .eq("id", instanceId);
    if (upErr) {
      console.error("programme_instances update error:", upErr.message);
      process.exit(1);
    }
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("programme_instances")
      .insert(instancePayload)
      .select("id")
      .single();
    if (insErr || !inserted?.id) {
      console.error("programme_instances insert error:", insErr?.message ?? "no id returned");
      process.exit(1);
    }
    instanceId = inserted.id;
  }

  const { error: delErr } = await supabase
    .from("programme_weeks")
    .delete()
    .eq("programme_instance_id", instanceId);
  if (delErr) {
    console.error("programme_weeks delete error:", delErr.message);
    process.exit(1);
  }

  const weekRows = Array.from({ length: 12 }, (_, i) => {
    const week_number = i + 1;
    return {
      programme_instance_id: instanceId,
      week_number,
      title: week_number === 1 ? "Week 1" : `Week ${week_number}`,
      is_unlocked: week_number === 1,
      plan_json: week_number === 1 ? planJson : null,
    };
  });

  const { error: wInsErr } = await supabase.from("programme_weeks").insert(weekRows);
  if (wInsErr) {
    console.error("programme_weeks insert error:", wInsErr.message);
    process.exit(1);
  }

  const slots = planJson.schedule?.length ?? 0;
  const timedSessions = scheduleSessionCount(planJson);

  console.log("programme_instance id:", instanceId);
  console.log("week updated: 1 (reseeded weeks 1–12)");
  console.log("plan_json.schedule length (day slots):", slots);
  console.log("plan_json.schedule days with time_cap_minutes > 0:", timedSessions);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
