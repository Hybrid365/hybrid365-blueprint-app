import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWeekBlueprint } from "@/app/lib/buildWeekBlueprint";

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

  lines.push("YOUR FIRST WEEK INSIDE HYBRID365");
  lines.push("");

  if (planJson?.first_name) {
    lines.push(`${planJson.first_name}, your Hybrid365 week is ready.`);
  } else {
    lines.push("Your Hybrid365 week is ready.");
  }

  lines.push("");
  lines.push("This is not a generic plan.");
  lines.push("It’s structured around your current level, time availability, and training goal.");
  lines.push("");

  lines.push("VIEW YOUR PLAN:");
  lines.push(planUrl);
  lines.push("");

  lines.push("Save this link — you’ll use it throughout the week.");
  lines.push("");

  lines.push("Over the next few days, keep an eye on your inbox.");
  lines.push("You’ll get coaching emails to help you execute these sessions properly.");
  lines.push("");

  lines.push("— Hybrid365");

  return lines.join("\n");
}

async function createAirtableRecord(input: Input, planJson: any, emailText: string) {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

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
  planUrl: string
): Promise<number> {
  const apiKey = process.env.KIT_API_KEY!;

  const res = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({
      email_address: email,
      fields: {
        blueprint,
        first_name: firstName || "",
        plan_url: planUrl || "",
      },
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

async function tagKitSubscriber(subscriberId: number) {
  const apiKey = process.env.KIT_API_KEY!;
  const tagId = process.env.KIT_TAG_ID!;

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

    const planJson = buildWeekBlueprint({
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

    const planId = generatePlanId();
    const planWithId = {
      ...planJson,
      plan_id: planId,

    };

const planUrl =
  process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/plan/${planId}`
    : `http://localhost:3000/plan/${planId}`;

    const emailText = asTextPlanForEmail(planWithId, planUrl);

    await createAirtableRecord(input, planWithId, emailText);

    const subscriberId = await kitCreateSubscriber(
  input.email,
  emailText,
  input.first_name || "",
  planUrl
);

    return NextResponse.json({
  ok: true,
  planId,
  planUrl,
  message: "Your First Week Inside Hybrid365 is on its way. Check your email — and junk/spam just in case.",
});
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}