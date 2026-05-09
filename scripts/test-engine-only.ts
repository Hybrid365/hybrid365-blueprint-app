/**
 * Safe engine QA: calls `buildWeekBlueprint` directly. No `/api/generate`,
 * no Airtable, no Kit, no network.
 *
 * Matrix matches `scripts/test-free-week-engine.ts` (engine fields only; emails omitted).
 *
 * Run from repo root:
 *   npx tsx scripts/test-engine-only.ts
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type { BlueprintInput } from "../app/lib/buildWeekBlueprint";
import { buildWeekBlueprint } from "../app/lib/buildWeekBlueprint";
import type { PlanJson } from "../app/lib/sessionLibrary";

type ExtendedProfile = PlanJson["profile"] & {
  runner_profile?: { label?: string };
};

function equipmentFullGymHybrid(): string[] {
  return [
    "Full gym",
    "Treadmill",
    "Bike / Spin bike",
    "Rower",
    "SkiErg",
    "Sled",
  ];
}

type EngineMatrixCase = {
  label: string;
  input: BlueprintInput;
};

/** Same 13 cases as API QA script (`test-free-week-engine.ts`), minus `email`. */
const ENGINE_CASES: EngineMatrixCase[] = [
  {
    label: "muscle-beginner-dumbbells",
    input: {
      first_name: "QA Muscle Beginner",
      goal_focus: "muscle",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Dumbbells only", "Full gym"],
      five_k_time: "34:00",
      double_sessions: false,
      preferred_days: ["Tue", "Thu", "Sat"],
    },
  },
  {
    label: "muscle-intermediate-dumbbells",
    input: {
      first_name: "QA Muscle Inter DB",
      goal_focus: "muscle",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Dumbbells only"],
      five_k_time: "28:30",
      double_sessions: false,
    },
  },
  {
    label: "muscle-advanced-full-gym",
    input: {
      first_name: "QA Muscle Advanced",
      goal_focus: "muscle",
      ability_level: "advanced",
      days_per_week: 5,
      weekly_hours_band: "7-10",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "20:45",
      double_sessions: true,
      preferred_days: ["Mon", "Wed", "Fri"],
    },
  },
  {
    label: "hybrid-beginner",
    input: {
      first_name: "QA Hybrid Beginner",
      goal_focus: "hybrid",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Full gym", "Bike / Spin bike"],
      five_k_time: "31:00",
      double_sessions: false,
    },
  },
  {
    label: "hybrid-intermediate",
    input: {
      first_name: "QA Hybrid Intermediate",
      goal_focus: "hybrid",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Rower", "SkiErg"],
      five_k_time: "25:30",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Thu"],
    },
  },
  {
    label: "hybrid-advanced",
    input: {
      first_name: "QA Hybrid Advanced",
      goal_focus: "hybrid",
      ability_level: "advanced",
      days_per_week: 6,
      weekly_hours_band: "7-10",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "19:45",
      double_sessions: true,
    },
  },
  {
    label: "hybrid-high-performance",
    input: {
      first_name: "QA Hybrid HiPerf",
      goal_focus: "hybrid",
      ability_level: "advanced",
      days_per_week: 7,
      weekly_hours_band: "10+",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "18:15",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    },
  },
  {
    label: "running-beginner",
    input: {
      first_name: "QA Running Beginner",
      goal_focus: "running",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Full gym", "Treadmill", "Bike / Spin bike"],
      five_k_time: "",
      double_sessions: false,
      preferred_days: ["Mon", "Wed", "Sat", "Sun"],
    },
  },
  {
    label: "running-intermediate",
    input: {
      first_name: "QA Running Intermediate",
      goal_focus: "running",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Treadmill"],
      five_k_time: "26:45",
      double_sessions: false,
    },
  },
  {
    label: "running-advanced",
    input: {
      first_name: "QA Running Advanced",
      goal_focus: "running",
      ability_level: "advanced",
      days_per_week: 6,
      weekly_hours_band: "10+",
      equipment: ["Full gym", "Treadmill", "Bike / Spin bike", "Sled"],
      five_k_time: "17:30",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Thu", "Sat"],
    },
  },
  {
    label: "constraint-bad-knees-low-impact",
    input: {
      first_name: "QA Bad Knees",
      goal_focus: "hybrid",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Bike / Spin bike", "Dumbbells only"],
      five_k_time: "27:40",
      double_sessions: false,
      notes: "Bad knees — low impact knee friendly where possible.",
    },
  },
  {
    label: "constraint-short-on-time",
    input: {
      first_name: "QA Short Time",
      goal_focus: "hybrid",
      ability_level: "intermediate",
      days_per_week: 4,
      weekly_hours_band: "2-3",
      equipment: ["Full gym"],
      five_k_time: "26:00",
      double_sessions: false,
      notes: "Short on time most weeks — minimise session length creep.",
      preferred_days: ["Mon", "Wed", "Fri", "Sat"],
    },
  },
  {
    label: "constraint-no-sled-no-row-no-ski",
    input: {
      first_name: "QA Limited Ergs",
      goal_focus: "hybrid",
      ability_level: "advanced",
      days_per_week: 5,
      weekly_hours_band: "7-10",
      equipment: [
        "Full gym",
        "Treadmill",
        "Bike / Spin bike",
        "Dumbbells only",
        "None (bodyweight only)",
      ],
      five_k_time: "19:05",
      double_sessions: false,
      notes:
        "No sled, no rower, no SkiErg at home gym — treadmill and bike OK; adapt anything that assumes those machines.",
    },
  },
];

type ResultEntry = {
  label: string;
  input: BlueprintInput;
  error?: string;
  plan?: PlanJson;
};

function printCaseSummary(plan: PlanJson): void {
  const prof = plan.profile as ExtendedProfile;
  const wp = plan.weekly_stress;

  console.log(`    profile.goal: ${plan.profile.goal}`);
  console.log(`    profile.level: ${plan.profile.level}`);
  console.log(`    profile.weekly_hours: ${plan.profile.weekly_hours}`);
  const rr = prof.runner_profile?.label;
  console.log(`    profile.runner_profile.label: ${rr !== undefined ? rr : "—"}`);
  console.log(`    weekly_stress.display_label: ${wp?.display_label ?? "—"}`);
  console.log(`    weekly_stress.relative_load: ${wp?.relative_load ?? "—"}`);
  console.log(`    weekly_stress.estimated_hours: ${wp?.estimated_hours ?? "—"}`);

  const sf = plan.safety_flags;
  if (!sf) {
    console.log("    safety_flags: none");
  } else {
    console.log(`    safety_flags.level: ${sf.level}`);
    console.log(`    safety_flags.flags: ${sf.flags.length ? sf.flags.join(", ") : "—"}`);
    for (const note of sf.notes) {
      console.log(`    safety_flags.note: ${note}`);
    }
  }

  console.log("    weekly_stress.notes:");
  if (wp?.notes?.length) {
    for (const line of wp.notes) {
      console.log(`      ${line}`);
    }
  } else {
    console.log("      —");
  }

  console.log("    schedule:");
  for (const day of plan.schedule) {
    const tags = day.tags?.length ? day.tags.join(", ") : "—";
    const cat =
      day.priority?.category_label ?? (day.priority ? day.priority.display_label : "—");
    console.log(
      `      ${day.day.padEnd(3)} | ${day.title.padEnd(28)} | tags: ${tags} | priority: ${cat}`
    );
  }
}

async function main() {
  const outDir = path.join(process.cwd(), "scripts", "test-results");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "engine-only-results.json");

  console.log("");
  console.log("Hybrid365 engine-only QA (buildWeekBlueprint, no API / Airtable / Kit)");
  console.log(`→ Cases: ${ENGINE_CASES.length}`);
  console.log("");

  const results: ResultEntry[] = [];

  for (let i = 0; i < ENGINE_CASES.length; i++) {
    const { label, input } = ENGINE_CASES[i];
    const n = i + 1;

    console.log(`[${n}/${ENGINE_CASES.length}] ${label}`);

    try {
      const plan = buildWeekBlueprint(input);
      results.push({ label, input, plan });
      printCaseSummary(plan);
      console.log("    ✓ OK\n");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ label, input, error: message });
      console.log(`    ✗ ERROR: ${message}\n`);
    }
  }

  const passed = results.filter((r) => r.plan !== undefined).length;
  const failed = results.length - passed;

  await writeFile(
    outFile,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        note: "Full PlanJson outputs from buildWeekBlueprint (local engine only)",
        total: results.length,
        passed,
        failed,
        results,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Saved: ${outFile}`);
  console.log(`Passed: ${passed} / ${results.length}`);
  console.log(`Failed: ${failed} / ${results.length}`);
  console.log("");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exitCode = 1;
});
