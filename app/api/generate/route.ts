import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWeekBlueprint } from "@/app/lib/buildWeekBlueprint";
import { applyHybrid75FreeWeek } from "@/app/lib/applyHybrid75FreeWeek";
import { generateHyroxFreeWeekPlan } from "@/app/lib/generateHyroxFreeWeekPlan";
import type { HyroxFreeWeekInput } from "@/app/lib/freeWeekHyroxTypes";
import {
  normalizeChallengeMode,
  type ChallengeMode,
} from "@/app/lib/freeWeekChallengeMode";

/** Public plan links sent to Kit for Hybrid 75 (production domain). */
const HYBRID75_KIT_PLAN_BASE = "https://plan.hybrid-365.com";

function kitPlanUrl(planId: string, challengeMode: ChallengeMode): string {
  if (challengeMode === "hybrid75" || challengeMode === "hyrox") {
    return `${HYBRID75_KIT_PLAN_BASE}/plan/${planId}`;
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (base) {
    return `${base.replace(/\/$/, "")}/plan/${planId}`;
  }
  return `http://localhost:3000/plan/${planId}`;
}

function generatePlanId(): string {
  return "h365_" + Math.random().toString(36).substring(2, 10);
}

const InputSchema = z.object({
  first_name: z.string().optional(),
  email: z.string().email(),
  days_per_week: z.coerce.number().min(2).max(7),
  weekly_hours_band: z.enum(["2-3", "3-5", "5-7", "7-10", "10+"]),
  goal_focus: z.enum(["running", "hybrid", "muscle"]),
  ability_level: z.enum(["beginner", "intermediate", "advanced"]),
  preferred_days: z.array(z.string()).optional(),
  double_sessions: z.boolean().optional(),
  equipment: z.array(z.string()).optional(),
  five_k_time: z.string().optional(),
  notes: z.string().optional(),
  challenge_mode: z.enum(["standard", "hybrid75", "hyrox"]).optional(),
  hyrox_details: z.record(z.string(), z.unknown()).optional(),
});

type Input = z.infer<typeof InputSchema>;

function formatDay(day: string) {
  const map: Record<string, string> = {
    mon: "MONDAY",
    tue: "TUESDAY",
    wed: "WEDNESDAY",
    thu: "THURSDAY",
    fri: "FRIDAY",
    sat: "SATURDAY",
    sun: "SUNDAY",
  };

  const key = day.toLowerCase().slice(0, 3);
  return map[key] || day.toUpperCase();
}

function asTextPlanForEmail(planJson: any, planUrl: string): string {
  const lines: string[] = [];

  const firstName = planJson?.first_name?.trim();

  lines.push("YOUR HYBRID365 TRAINING WEEK IS READY");
  lines.push("Build a body that performs. Refuse Average.");
  lines.push("");

  if (firstName) {
    lines.push(`${firstName}, your personalised Hybrid365 training week is ready.`);
  } else {
    lines.push("Your personalised Hybrid365 training week is ready.");
  }

  lines.push("");
  lines.push("This is not a random collection of workouts.");
  lines.push("");
  lines.push(
    "Your week has been built around your current goal, training level, available days, schedule and focus — so you can see how running, lifting, hybrid work and recovery should actually fit together."
  );
  lines.push("");

  lines.push("VIEW YOUR PLAN:");
  lines.push(planUrl);
  lines.push("");

  lines.push("Save this link — this is your training week blueprint.");
  lines.push("");

  lines.push("HOW TO USE IT:");
  lines.push("1. Read the full week before you start.");
  lines.push("2. Pay attention to the order of sessions, not just the workouts themselves.");
  lines.push("3. Keep easy work easy, and only push intensity where the plan asks for it.");
  lines.push("4. Use the notes to understand the purpose behind each session.");
  lines.push("");

  lines.push("WHY STRUCTURE MATTERS:");
  lines.push(
    "Most people do not fail at hybrid training because they lack effort. They fail because their week is poorly structured — too much intensity, random lifting, poor recovery, and no clear progression."
  );
  lines.push("");
  lines.push(
    "Hybrid365 is built to solve that: helping you become fast, fit and strong without guessing how to balance the week."
  );
  lines.push("");

  lines.push("WANT THE FULL 12-WEEK VERSION?");
  lines.push("");
  lines.push(
    "Inside the Hybrid365 Community, members get a personalised 12-week Hybrid Training Blueprint built around their goal, level, schedule and training focus."
  );
  lines.push("");
  lines.push("You also get:");
  lines.push("- Goal-specific tracks: Build Lean Muscle, Hybrid Performance, and Hyrox Performance");
  lines.push("- Hybrid Performance Mastery education");
  lines.push("- Running, strength and Hyrox training guidance");
  lines.push("- Weekly check-ins and accountability");
  lines.push("- Community challenges, leaderboards and prizes");
  lines.push("- A structure designed to help you become fast, fit and strong");
  lines.push("");

  lines.push("Explore Hybrid365 Community:");
  lines.push("https://plan.hybrid-365.com/community");
  lines.push("");

  lines.push("Execute the week properly.");
  lines.push("Learn from it.");
  lines.push("Refuse Average.");
  lines.push("");
  lines.push("— Hybrid365");

  return lines.join("\n");
}

async function createAirtableRecord(
  input: Input,
  planJson: any,
  emailText: string,
  planAccessUrl: string
) {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  // Requires a matching column in Airtable (e.g. Single line text "Athlete URL").
  const fields = {
    "First Name": input.first_name || "",
    Email: input.email,
    "Plan ID": String(planJson.plan_id || ""),
    "Days Per Week": input.days_per_week,
    "Preferred Days": (input.preferred_days || []).join(", "),
    "Goal Focus": input.goal_focus,
    Experience: input.ability_level,
    Equipment: (input.equipment || []).join(", "),
    "Weekly Hours Band": input.weekly_hours_band,
    "5K Time": input.five_k_time || "",
    Notes: input.notes || "",
    "Generated Plan JSON": JSON.stringify(planJson),
    "Generated Plan Email Version": emailText,
    "Athlete URL": planAccessUrl || "",
    Status: "generated",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Airtable error: ${res.status} ${text}`);
  }
}

async function kitCreateSubscriber(
  email: string,
  blueprint: string,
  firstName: string,
  planUrl: string,
  challengeMode: ChallengeMode
): Promise<number> {
  const apiKey = process.env.KIT_API_KEY!;

  const fields: Record<string, string> = {
    blueprint,
    first_name: firstName || "",
    plan_url: planUrl || "",
    // Kit automations historically used athlete_url — point at the public free plan view.
    athlete_url: planUrl || "",
  };

  if (challengeMode === "hybrid75") {
    fields.challenge_mode = "hybrid75";
  } else if (challengeMode === "hyrox") {
    fields.challenge_mode = "hyrox";
  }

  const res = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({
      email_address: email,
      fields,
      state: "active",
    }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(`Kit subscriber error: ${res.status} ${JSON.stringify(json)}`);
  }

  const subscriberId = json?.subscriber?.id ?? json?.id;

  if (!subscriberId) {
    throw new Error(`Kit subscriber error: missing subscriber id in response ${JSON.stringify(json)}`);
  }

  return Number(subscriberId);
}

async function tagKitSubscriber(subscriberId: number, tagId: string) {
  const apiKey = process.env.KIT_API_KEY!;

  const res = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({}),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kit tag error: ${res.status} ${text}`);
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const input = InputSchema.parse(raw);

    const challengeMode = normalizeChallengeMode(input.challenge_mode);

    let planJson;

    if (challengeMode === "hyrox") {
      const hyroxInput: HyroxFreeWeekInput = {
        days_per_week: input.days_per_week,
        weekly_hours_band: input.weekly_hours_band,
        ability_level: input.ability_level,
        equipment: input.equipment ?? [],
        preferred_days: input.preferred_days,
        double_sessions: input.double_sessions,
        five_k_time: input.five_k_time,
        notes: input.notes,
        ...(input.hyrox_details as Partial<HyroxFreeWeekInput>),
      };
      planJson = generateHyroxFreeWeekPlan(hyroxInput);
    } else {
      planJson = buildWeekBlueprint({
        days_per_week: input.days_per_week,
        weekly_hours_band: input.weekly_hours_band,
        goal_focus: input.goal_focus,
        ability_level: input.ability_level,
        double_sessions: input.double_sessions,
        preferred_days: input.preferred_days,
        equipment: input.equipment,
        five_k_time: input.five_k_time,
        notes: input.notes,
      });

      if (challengeMode === "hybrid75") {
        planJson = applyHybrid75FreeWeek(planJson, {
          days_per_week: input.days_per_week,
          ability_level: input.ability_level,
          equipment: input.equipment,
        });
      } else {
        planJson = { ...planJson, challenge_mode: "standard" };
      }
    }

    const planId = generatePlanId();
    const planWithId = {
      ...planJson,
      plan_id: planId,
      first_name: input.first_name?.trim() || "",
    };

    const planUrl = kitPlanUrl(planId, challengeMode);

    const emailText = asTextPlanForEmail(planWithId, planUrl);

    await createAirtableRecord(input, planWithId, emailText, planUrl);

    const subscriberId = await kitCreateSubscriber(
      input.email,
      emailText,
      input.first_name || "",
      planUrl,
      challengeMode
    );

    // Tags trigger Kit automations — standard free week vs Hybrid 75 challenge (separate flows).
    const kitTagId =
      challengeMode === "hybrid75"
        ? process.env.KIT_HYBRID75_TAG_ID?.trim()
        : challengeMode === "hyrox"
          ? process.env.KIT_HYROX_TAG_ID?.trim() || process.env.KIT_TAG_ID?.trim()
          : process.env.KIT_TAG_ID?.trim();
    const kitTagEnvName =
      challengeMode === "hybrid75"
        ? "KIT_HYBRID75_TAG_ID"
        : challengeMode === "hyrox"
          ? "KIT_HYROX_TAG_ID"
          : "KIT_TAG_ID";
    const kitTagHint =
      challengeMode === "hybrid75"
        ? ' (Kit tag name: "Hybrid 75 Challenge")'
        : challengeMode === "hyrox"
          ? ' (HYROX free week — e.g. "HYROX Free Week requested")'
          : ' (standard free week — e.g. "Hybrid365 Blueprint requested")';

    if (!kitTagId) {
      console.warn(
        `[generate] ${kitTagEnvName} is missing — subscriber was created but Kit tag-based automation may not run.${kitTagHint}`
      );
    } else {
      try {
        await tagKitSubscriber(subscriberId, kitTagId);
      } catch (tagErr) {
        console.error("[generate] Kit tag failed (subscriber still created):", tagErr);
      }
    }

    return NextResponse.json({
      ok: true,
      planId,
      planUrl,
      message:
        "Your Hybrid365 training week is being prepared. Your plan link will arrive by email in around 10–15 minutes. Check your inbox and junk/spam just in case.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}