// app/api/generate/route.ts

import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWeekBlueprint } from "@/app/lib/buildWeekBlueprint";

const InputSchema = z.object({
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

function asTextPlanForEmail(planJson: any): string {
  const lines: string[] = [];

  lines.push("YOUR HYBRID365 WEEKLY BLUEPRINT");
  lines.push("");

  const schedule = Array.isArray(planJson?.schedule) ? planJson.schedule : [];

  for (const d of schedule) {
    lines.push(`${d.day}: ${d.title}`);

    if (d.intent) {
      lines.push(`• ${d.intent}`);
    }

    const s = d.session || {};

    if (Array.isArray(s.warm_up) && s.warm_up.length) {
      lines.push("Warm-up:");
      for (const item of s.warm_up) lines.push(`- ${item}`);
    }

    if (Array.isArray(s.main) && s.main.length) {
      lines.push("Main:");
      for (const item of s.main) lines.push(`- ${item}`);
    }

    if (Array.isArray(s.cool_down) && s.cool_down.length) {
      lines.push("Cool-down:");
      for (const item of s.cool_down) lines.push(`- ${item}`);
    }

    if (Array.isArray(s.finish) && s.finish.length) {
      lines.push("Finish:");
      for (const item of s.finish) lines.push(`- ${item}`);
    }

    if (Array.isArray(s.notes) && s.notes.length) {
      lines.push("Coaching notes:");
      for (const item of s.notes) lines.push(`- ${item}`);
    }

    if (typeof d.time_cap_minutes === "number") {
      lines.push(`Time cap: ${d.time_cap_minutes} min`);
    }

    lines.push("");
  }

  lines.push(planJson.cta.headline);
  lines.push(planJson.cta.body);
  lines.push(planJson.cta.button_url);

  return lines.join("\n");
}

async function createAirtableRecord(input: Input, planJson: any, emailText: string) {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

  const fields = {
    Email: input.email,
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

async function kitCreateSubscriber(email: string, blueprint: string): Promise<number> {
  const apiKey = process.env.KIT_API_KEY!;

  const res = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({
      email_address: email,
      fields: { blueprint },
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
    });

    const emailText = asTextPlanForEmail(planJson);

    await createAirtableRecord(input, planJson, emailText);

    const subscriberId = await kitCreateSubscriber(input.email, emailText);
    await tagKitSubscriber(subscriberId);

    return NextResponse.json({
      ok: true,
      message: "Blueprint requested ✅ Check your email in ~20 minutes.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 400 }
    );
  }
}