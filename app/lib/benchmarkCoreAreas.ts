/**
 * Hybrid365 baseline "core areas" — engine + strength + hybrid + body (Milestone 15).
 * Used by dashboard onboarding, challenge checklist, and programme intelligence signals.
 */

/** Canonical DB `test_type` values — keep stable for queries and UI. */
export const RUN_MARKER_TEST_TYPES = ["5km time trial", "3km time trial"] as const;

export const ENGINE_MARKER_TEST_TYPES = ["1km SkiErg", "1km Row"] as const;

export const BODY_MARKER_TEST_TYPES = ["Bodyweight"] as const;

export const STRENGTH_BENCHMARK_TEST_TYPES = [
  "Pull-up max reps",
  "Push-up max reps",
  "Squat 5RM",
  "Squat 8RM",
  "DB Bench 8RM",
  "RDL 8RM",
  "Trap bar deadlift 5RM",
  "Farmer carry 40m",
] as const;

const RUN_SET = new Set<string>(RUN_MARKER_TEST_TYPES);
const ENGINE_SET = new Set<string>(ENGINE_MARKER_TEST_TYPES);
const BODY_SET = new Set<string>(BODY_MARKER_TEST_TYPES);
const STRENGTH_SET = new Set<string>(STRENGTH_BENCHMARK_TEST_TYPES);

export type HybridBaselineChecklist = {
  body: boolean;
  run: boolean;
  engine: boolean;
  strength: boolean;
};

export function isRunMarkerType(testType: string | null | undefined): boolean {
  return RUN_SET.has(String(testType ?? "").trim());
}

export function isEngineMarkerType(testType: string | null | undefined): boolean {
  return ENGINE_SET.has(String(testType ?? "").trim());
}

export function isBodyMarkerType(testType: string | null | undefined): boolean {
  return BODY_SET.has(String(testType ?? "").trim());
}

export function isStrengthBenchmarkType(testType: string | null | undefined): boolean {
  return STRENGTH_SET.has(String(testType ?? "").trim());
}

/** Four core baseline areas: body, run (5k or 3k), engine (ski or row), any listed strength marker. */
export function coreBaselineAreaFlags(tests: { test_type: string | null }[]): HybridBaselineChecklist {
  const types = new Set((tests.map((t) => t.test_type).filter(Boolean) as string[]).map((s) => s.trim()));
  return {
    body: [...types].some((t) => BODY_SET.has(t)),
    run: [...types].some((t) => RUN_SET.has(t)),
    engine: [...types].some((t) => ENGINE_SET.has(t)),
    strength: [...types].some((t) => STRENGTH_SET.has(t)),
  };
}

export function countCoreBaselineAreas(tests: { test_type: string | null }[]): number {
  const f = coreBaselineAreaFlags(tests);
  return Number(f.body) + Number(f.run) + Number(f.engine) + Number(f.strength);
}
