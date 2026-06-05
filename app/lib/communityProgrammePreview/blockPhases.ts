import type { BlockPhase, PreviewAbilityLevel } from "./types";

const PHASE_ORDER: BlockPhase[] = ["base", "build", "race_prep", "test_retest"];

export const BLOCK_PHASE_LABELS: Record<BlockPhase, string> = {
  base: "Base Block",
  build: "Build Block",
  race_prep: "Race Prep Block",
  test_retest: "Test / Retest Block",
};

export const BLOCK_PHASE_PRIORITIES: Record<BlockPhase, string> = {
  base: "Aerobic base · load tolerance · controlled threshold · movement quality · strength endurance foundation · low-impact erg volume · limited early compromised running",
  build: "Progress threshold & erg density · increase station exposure · build compromised running tolerance · maintain aerobic support",
  race_prep: "Race-specific compromised sessions · sharpen threshold · maintain aerobic freshness · station weakness targeting · controlled hard/easy rhythm",
  test_retest: "Controlled benchmarks · deload where needed · retest threshold/erg/station markers · absorb training before next block",
};

export function blockPhaseForNumber(blockNumber: number): BlockPhase {
  const idx = Math.max(0, blockNumber - 1) % PHASE_ORDER.length;
  return PHASE_ORDER[idx] ?? "base";
}

export function blockPhaseLabel(phase: BlockPhase): string {
  return BLOCK_PHASE_LABELS[phase];
}

export function weekProgressionFocus(weekInBlock: number): string {
  switch (weekInBlock) {
    case 1:
      return "Baseline / intro exposure";
    case 2:
      return "Build volume, reps, density or threshold duration";
    case 3:
      return "Peak week — highest load within block";
    case 4:
      return "Deload / review / controlled benchmark";
    default:
      return "Progressive load";
  }
}

export function weekTitle(weekInBlock: number, phase: BlockPhase): string {
  const phaseShort =
    phase === "base"
      ? "Build the base"
      : phase === "build"
        ? "Build the engine"
        : phase === "race_prep"
          ? "Race prep"
          : "Test & retest";
  const weekLabels = [
    "Week 1 — Intro exposure",
    "Week 2 — Build load",
    "Week 3 — Peak week",
    "Week 4 — Deload & review",
  ];
  return `${weekLabels[weekInBlock - 1] ?? `Week ${weekInBlock}`} · ${phaseShort}`;
}

export function weekFocusCopy(weekInBlock: number, phase: BlockPhase): string {
  const base = weekProgressionFocus(weekInBlock);
  if (phase === "base" && weekInBlock <= 2) {
    return `${base}. Prioritise aerobic base and movement quality — keep compromised running controlled.`;
  }
  if (phase === "test_retest" && weekInBlock === 4) {
    return `${base}. Use controlled benchmarks to guide next block progression.`;
  }
  return base;
}

/** Scale compromised session intensity down in early base block weeks. */
export function baseBlockCompromisedScale(
  phase: BlockPhase,
  weekInBlock: number,
  level: PreviewAbilityLevel
): number {
  if (phase !== "base") return 1;
  if (weekInBlock === 1) return level === "beginner" ? 0.6 : 0.75;
  if (weekInBlock === 2) return level === "beginner" ? 0.8 : 0.9;
  return 1;
}

export function nextBlockProgressionHint(blockNumber: number): string {
  const nextPhase = blockPhaseForNumber(blockNumber + 1);
  return `Block ${blockNumber + 1} will open as ${BLOCK_PHASE_LABELS[nextPhase]} — ${BLOCK_PHASE_PRIORITIES[nextPhase]}`;
}
