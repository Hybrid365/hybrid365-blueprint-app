/**
 * Local QA — paid 12-week programme intelligence + rationale (no server).
 * Run: npm run qa:paid-intelligence
 */

import { generate12WeekProgramme } from "../app/lib/generate12WeekProgramme";
import type { PaidProgrammeInput } from "../app/lib/generate12WeekProgramme";
import { buildBenchmarkSignals } from "../app/lib/paidProgrammeIntelligence";

function week1SessionTitles(plan: ReturnType<typeof generate12WeekProgramme>[0]["plan_json"]): string[] {
  return plan.schedule.map((d) => d.title).filter(Boolean);
}

function runCase(name: string, input: PaidProgrammeInput) {
  const weeks = generate12WeekProgramme(input);
  const w1 = weeks[0]!;
  const pj = w1.plan_json;
  const rationale = pj.programme_rationale;
  const intel = pj.programme_intelligence;

  console.log("\n" + "=".repeat(72));
  console.log(`CASE: ${name}`);
  console.log("=".repeat(72));
  console.log("programme_intelligence:", JSON.stringify(intel, null, 2));
  console.log("\nprogramme_rationale.headline:", rationale?.headline ?? "(none)");
  console.log("key_priorities:", JSON.stringify(rationale?.key_priorities ?? [], null, 2));
  console.log("\nfirst week session titles:", week1SessionTitles(pj));
  console.log("safety_flags:", JSON.stringify(pj.safety_flags ?? null, null, 2));
}

function base(): PaidProgrammeInput {
  return {
    first_name: "Test",
    days_per_week: 5,
    weekly_hours_band: "5-7",
    goal_focus: "hybrid",
    ability_level: "intermediate",
    equipment: ["Full gym"],
    five_k_time: "24:00",
    notes: "",
    has_injury: false,
    double_sessions: false,
    double_session_days: [],
    rationale_context: {
      assessment: {
        event_type: "No event booked",
        event_date: null,
        target_time: null,
        biggest_limiter: null,
        injury_flags: [],
        movements_to_avoid: [],
        hyrox_pb: null,
        hyrox_experience: "Some experience",
        strength_experience: "Intermediate",
        goal_focus_raw: "Hybrid / Hyrox performance",
      },
      hasBaseline5k: true,
      hasBenchmarkTests: true,
      double_session_days: [],
      benchmark_signals: buildBenchmarkSignals([
        {
          test_type: "5km time trial",
          test_time: "24:00",
          test_value: null,
          tested_at: "2026-01-01",
        },
        {
          test_type: "1km SkiErg",
          test_time: "04:10",
          test_value: null,
          tested_at: "2026-01-02",
        },
        {
          test_type: "1km Row",
          test_time: "03:50",
          test_value: null,
          tested_at: "2026-01-03",
        },
        {
          test_type: "Bodyweight",
          test_time: null,
          test_value: 78,
          tested_at: "2026-01-04",
        },
      ]),
    },
  };
}

runCase("A. General hybrid, no event", {
  ...base(),
  goal_focus: "hybrid",
  five_k_time: "24:00",
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      event_type: "No event booked",
      biggest_limiter: "General fitness",
      goal_focus_raw: "Hybrid fitness",
    },
    hasBaseline5k: true,
    hasBenchmarkTests: true,
  },
});

runCase("B. Hyrox Pro, advanced, competitive", {
  ...base(),
  ability_level: "advanced",
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      event_type: "Hyrox Pro",
      event_date: "2026-09-01",
      target_time: "1:05:00",
      hyrox_experience: "Competitive / racing regularly",
      strength_experience: "Advanced",
      biggest_limiter: "Running under fatigue after stations",
      goal_focus_raw: "Hyrox performance",
    },
  },
});

runCase("C. Running goal, 5km benchmark", {
  ...base(),
  goal_focus: "running",
  five_k_time: "21:30",
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      event_type: "Running race (10k / half / marathon)",
      goal_focus_raw: "Running",
      biggest_limiter: "Endurance for longer efforts",
    },
    hasBaseline5k: true,
    benchmark_signals: buildBenchmarkSignals([
      {
        test_type: "5km time trial",
        test_time: "21:30",
        test_value: null,
        tested_at: "2026-01-01",
      },
    ]),
  },
});

runCase("D. Body composition / strength goal", {
  ...base(),
  goal_focus: "muscle",
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      event_type: "No event booked",
      goal_focus_raw: "Muscle / body composition",
      biggest_limiter: "Body composition — want to lean out while keeping strength",
    },
  },
});

runCase("E. Bad knees / low impact", {
  ...base(),
  has_injury: true,
  notes: "Bad knees — prefer low impact | Injury flags: knee pain | Avoid movements: jumping lunges",
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      injury_flags: ["Knee pain"],
      movements_to_avoid: ["Jumping lunges", "Deep squat jumps"],
      biggest_limiter: "Impact tolerance — need low-impact options",
    },
  },
});

runCase("F. Wall balls / Hyrox station limiter", {
  ...base(),
  equipment: ["Dumbbells", "Kettlebell", "Bike"],
  rationale_context: {
    ...base().rationale_context!,
    assessment: {
      ...base().rationale_context!.assessment!,
      event_type: "Hyrox Open",
      biggest_limiter: "Wall balls and sled pushes gas me early",
      goal_focus_raw: "Hyrox",
    },
  },
});

runCase("G. Missing benchmarks", {
  ...base(),
  five_k_time: "",
  rationale_context: {
    ...base().rationale_context!,
    hasBaseline5k: false,
    hasBenchmarkTests: false,
    benchmark_signals: buildBenchmarkSignals([]),
  },
});

console.log("\nDone.\n");
