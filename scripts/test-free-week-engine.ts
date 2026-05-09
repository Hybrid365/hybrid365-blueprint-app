/**
 * Local QA: POST multiple payloads to `/api/generate` (matches `free-week/page.tsx`).
 *
 * WARNING: Successful responses still execute the server's Airtable + Kit side effects.
 * Uses fake qa+...@hybrid365.test emails only — keep that in mind for CRM cleanup.
 *
 * Prerequisites:
 *   npm run dev  (listening on localhost:3000)
 *   .env.local populated so AIRTABLE_* and KIT_* succeed (otherwise requests may 400/fail server-side).
 *
 * Run:
 *   npx tsx scripts/test-free-week-engine.ts
 *
 * Override base URL:
 *   BASE_URL=http://127.0.0.1:3000 npx tsx scripts/test-free-week-engine.ts
 */

import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const GENERATE_URL = `${BASE_URL}/api/generate`;

/** Request body mirrors `free-week/page.tsx` → fetch("/api/generate") payload and `InputSchema` in route.ts */
type GeneratePayload = {
  first_name?: string;
  email: string;
  days_per_week: number;
  weekly_hours_band: "2-3" | "3-5" | "5-7" | "7-10" | "10+";
  goal_focus: "running" | "hybrid" | "muscle";
  ability_level: "beginner" | "intermediate" | "advanced";
  preferred_days?: string[];
  double_sessions?: boolean;
  equipment?: string[];
  five_k_time?: string;
  notes?: string;
};

type TestMatrixCase = {
  label: string;
  body: GeneratePayload;
};

/** Match form equipment option strings (`app/free-week/page.tsx`). */
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

const TEST_CASES: TestMatrixCase[] = [
  {
    label: "muscle-beginner-dumbbells",
    body: {
      first_name: "QA Muscle Beginner",
      email: "qa+muscle-beginner-dumbbells@hybrid365.test",
      goal_focus: "muscle",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Dumbbells only", "Full gym"],
      five_k_time: "34:00",
      double_sessions: false,
      preferred_days: ["Tue", "Thu", "Sat"],
      notes: "",
    },
  },
  {
    label: "muscle-intermediate-dumbbells",
    body: {
      first_name: "QA Muscle Inter DB",
      email: "qa+muscle-intermediate-dbells@hybrid365.test",
      goal_focus: "muscle",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Dumbbells only"],
      five_k_time: "28:30",
      double_sessions: false,
      notes: "",
    },
  },
  {
    label: "muscle-advanced-full-gym",
    body: {
      first_name: "QA Muscle Advanced",
      email: "qa+muscle-advanced-fullgym@hybrid365.test",
      goal_focus: "muscle",
      ability_level: "advanced",
      days_per_week: 5,
      weekly_hours_band: "7-10",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "20:45",
      double_sessions: true,
      preferred_days: ["Mon", "Wed", "Fri"],
      notes: "",
    },
  },
  {
    label: "hybrid-beginner",
    body: {
      first_name: "QA Hybrid Beginner",
      email: "qa+hybrid-beginner@hybrid365.test",
      goal_focus: "hybrid",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Full gym", "Bike / Spin bike"],
      five_k_time: "31:00",
      double_sessions: false,
      notes: "",
    },
  },
  {
    label: "hybrid-intermediate",
    body: {
      first_name: "QA Hybrid Intermediate",
      email: "qa+hybrid-intermediate@hybrid365.test",
      goal_focus: "hybrid",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Rower", "SkiErg"],
      five_k_time: "25:30",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Thu"],
      notes: "",
    },
  },
  {
    label: "hybrid-advanced",
    body: {
      first_name: "QA Hybrid Advanced",
      email: "qa+hybrid-advanced@hybrid365.test",
      goal_focus: "hybrid",
      ability_level: "advanced",
      days_per_week: 6,
      weekly_hours_band: "7-10",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "19:45",
      double_sessions: true,
      notes: "",
    },
  },
  {
    label: "hybrid-high-performance",
    body: {
      first_name: "QA Hybrid HiPerf",
      email: "qa+hybrid-hiperf@hybrid365.test",
      goal_focus: "hybrid",
      ability_level: "advanced",
      days_per_week: 7,
      weekly_hours_band: "10+",
      equipment: equipmentFullGymHybrid(),
      five_k_time: "18:15",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      notes: "",
    },
  },
  {
    label: "running-beginner",
    body: {
      first_name: "QA Running Beginner",
      email: "qa+running-beginner@hybrid365.test",
      goal_focus: "running",
      ability_level: "beginner",
      days_per_week: 4,
      weekly_hours_band: "3-5",
      equipment: ["Full gym", "Treadmill", "Bike / Spin bike"],
      five_k_time: "",
      double_sessions: false,
      preferred_days: ["Mon", "Wed", "Sat", "Sun"],
      notes: "",
    },
  },
  {
    label: "running-intermediate",
    body: {
      first_name: "QA Running Intermediate",
      email: "qa+running-intermediate@hybrid365.test",
      goal_focus: "running",
      ability_level: "intermediate",
      days_per_week: 5,
      weekly_hours_band: "5-7",
      equipment: ["Full gym", "Treadmill"],
      five_k_time: "26:45",
      double_sessions: false,
      notes: "",
    },
  },
  {
    label: "running-advanced",
    body: {
      first_name: "QA Running Advanced",
      email: "qa+running-advanced@hybrid365.test",
      goal_focus: "running",
      ability_level: "advanced",
      days_per_week: 6,
      weekly_hours_band: "10+",
      equipment: ["Full gym", "Treadmill", "Bike / Spin bike", "Sled"],
      five_k_time: "17:30",
      double_sessions: true,
      preferred_days: ["Mon", "Tue", "Thu", "Sat"],
      notes: "",
    },
  },
  {
    label: "constraint-bad-knees-low-impact",
    body: {
      first_name: "QA Bad Knees",
      email: "qa+constraint-bad-knees-lowimpact@hybrid365.test",
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
    body: {
      first_name: "QA Short Time",
      email: "qa+constraint-short-time@hybrid365.test",
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
    body: {
      first_name: "QA Limited Ergs",
      email: "qa+constraint-no-ergs-no-sled@hybrid365.test",
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

type ApiOkResponse = {
  ok: boolean;
  planId?: string;
  planUrl?: string;
  athleteUrl?: string;
  message?: string;
  error?: string;
};

type ResultRow = {
  label: string;
  submitted: GeneratePayload;
  httpStatus: number;
  apiOk?: boolean;
  planId?: string;
  planUrl?: string;
  athleteUrl?: string;
  message?: string;
  error?: string;
};

async function main() {
  const outDir = path.join(process.cwd(), "scripts", "test-results");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "free-week-engine-results.json");

  console.log("");
  console.log("Hybrid365 Free Week engine — QA matrix");
  console.log(`→ POST ${GENERATE_URL}`);
  console.log(`→ Cases: ${TEST_CASES.length}`);
  console.log("");

  const results: ResultRow[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const { label, body } = TEST_CASES[i];
    const n = i + 1;

    console.log(`[${n}/${TEST_CASES.length}] ${label}`);

    const row: ResultRow = {
      label,
      submitted: body,
      httpStatus: 0,
    };

    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      row.httpStatus = res.status;

      let json: ApiOkResponse;
      try {
        json = (await res.json()) as ApiOkResponse;
      } catch {
        json = {
          ok: false,
          error: `Non-JSON response (status ${res.status})`,
        };
      }

      row.apiOk = json.ok === true;
      row.planId = json.planId;
      row.planUrl = json.planUrl;
      row.athleteUrl = json.athleteUrl;
      row.message = json.message;
      row.error = json.error;

      console.log(`    http: ${row.httpStatus}  api ok: ${row.apiOk === true}`);
      if (json.planId) console.log(`    planId: ${json.planId}`);
      if (json.planUrl) console.log(`    planUrl: ${json.planUrl}`);
      if (json.athleteUrl) console.log(`    athleteUrl: ${json.athleteUrl}`);
      if (json.error) console.log(`    error: ${json.error}`);
      if (json.ok && json.message)
        console.log(`    message: ${json.message.slice(0, 80)}…`);

      if (!res.ok || !json.ok) {
        console.log(`    ✗ FAILED: ${label} — HTTP ${row.httpStatus} ${json.error || ""}`);
      } else {
        console.log(`    ✓ OK`);
      }
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      row.error = `fetch failed: ${msg}`;
      console.log(`    ✗ FAILED (network): ${label} — ${msg}`);
    }

    console.log("");
    results.push(row);
  }

  const summary = {
    generated_at: new Date().toISOString(),
    generate_url: GENERATE_URL,
    total: results.length,
    passed: results.filter((r) => r.httpStatus === 200 && r.apiOk === true).length,
    failed: results.filter((r) => !(r.httpStatus === 200 && r.apiOk === true)).length,
    results,
  };

  await writeFile(outFile, JSON.stringify(summary, null, 2), "utf8");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Saved: ${outFile}`);
  console.log(`Passed: ${summary.passed} / ${summary.total}`);
  console.log(`Failed: ${summary.failed} / ${summary.total}`);
  console.log("");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exitCode = 1;
});
