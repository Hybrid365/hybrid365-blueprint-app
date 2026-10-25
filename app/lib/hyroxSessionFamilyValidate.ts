/**
 * SessionFamily validators — fail loudly in development/QA.
 */

import { assertLegalPrescriptionRule, PrescriptionEngineError } from "@/app/lib/hyroxPrescriptionEngine";
import {
  PRESCRIPTION_SLOT_IDS,
  PROGRESSION_DIMENSIONS,
  RECOVERY_TYPES,
  SESSION_FAMILY_MODALITIES,
  SESSION_FAMILY_TRANSITION_ACTIONS,
  SESSION_FAMILY_TRANSITION_WHENS,
  type IntervalBlock,
  type RecoverySpec,
  type SessionFamily,
  type SessionFamilyStage,
  type SessionFamilyTransition,
  type StructuredWorkout,
  type WorkSpec,
} from "@/app/lib/hyroxSessionFamilyTypes";

export class SessionFamilyValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`SessionFamily validation failed:\n- ${issues.join("\n- ")}`);
    this.name = "SessionFamilyValidationError";
    this.issues = issues;
  }
}

const SLOT_SET = new Set<string>(PRESCRIPTION_SLOT_IDS);
const DIMENSION_SET = new Set<string>(PROGRESSION_DIMENSIONS);
const RECOVERY_SET = new Set<string>(RECOVERY_TYPES);
const ACTION_SET = new Set<string>(SESSION_FAMILY_TRANSITION_ACTIONS);
const WHEN_SET = new Set<string>(SESSION_FAMILY_TRANSITION_WHENS);
const MODALITY_SET = new Set<string>(SESSION_FAMILY_MODALITIES);

function push(issues: string[], message: string): void {
  issues.push(message);
}

function validateWork(work: WorkSpec, path: string, issues: string[]): void {
  if (!work || typeof work !== "object") {
    push(issues, `${path}: work missing`);
    return;
  }
  if (work.kind === "time") {
    if (work.unit !== "sec") push(issues, `${path}: time work unit must be sec`);
    if (typeof work.value !== "number" || !Number.isFinite(work.value) || work.value <= 0) {
      push(issues, `${path}: time work value must be a positive finite number`);
    }
    return;
  }
  if (work.kind === "distance") {
    if (work.unit !== "m" && work.unit !== "km") {
      push(issues, `${path}: distance unit must be m or km`);
    }
    if (typeof work.value !== "number" || !Number.isFinite(work.value) || work.value <= 0) {
      push(issues, `${path}: distance work value must be a positive finite number`);
    }
    return;
  }
  push(issues, `${path}: unknown work kind`);
}

function validateRecovery(recovery: RecoverySpec, path: string, issues: string[]): void {
  if (!recovery || typeof recovery !== "object") {
    push(issues, `${path}: recovery missing`);
    return;
  }
  if (
    typeof recovery.durationSeconds !== "number" ||
    !Number.isFinite(recovery.durationSeconds) ||
    recovery.durationSeconds < 0
  ) {
    push(issues, `${path}: durationSeconds must be a non-negative finite number`);
  }
  if (!RECOVERY_SET.has(recovery.type)) {
    push(issues, `${path}: invalid recovery type ${String(recovery.type)}`);
  }
}

function validateBlock(block: IntervalBlock, path: string, issues: string[]): void {
  if (!block || typeof block !== "object" || !("type" in block)) {
    push(issues, `${path}: block missing type`);
    return;
  }
  switch (block.type) {
    case "repeat":
      if (typeof block.reps !== "number" || !Number.isInteger(block.reps) || block.reps < 1) {
        push(issues, `${path}: reps must be an integer >= 1`);
      }
      validateWork(block.work, `${path}.work`, issues);
      if (!Array.isArray(block.recoveries)) {
        push(issues, `${path}: recoveries must be an array`);
      } else {
        block.recoveries.forEach((r, i) => validateRecovery(r, `${path}.recoveries[${i}]`, issues));
      }
      return;
    case "continuous":
      validateWork(block.work, `${path}.work`, issues);
      return;
    case "station_round":
      if (typeof block.rounds !== "number" || block.rounds < 1) {
        push(issues, `${path}: rounds must be >= 1`);
      }
      if (!block.station?.name) push(issues, `${path}: station.name required`);
      if (block.run) validateWork(block.run, `${path}.run`, issues);
      block.recoveries?.forEach((r, i) => validateRecovery(r, `${path}.recoveries[${i}]`, issues));
      return;
    case "strength":
      if (!Array.isArray(block.exercises) || block.exercises.length === 0) {
        push(issues, `${path}: strength exercises required`);
      }
      return;
    default:
      push(issues, `${path}: unknown block type`);
  }
}

function validateStructuredWorkout(workout: StructuredWorkout, path: string, issues: string[]): void {
  if (!workout || typeof workout !== "object") {
    push(issues, `${path}: structuredWorkout missing`);
    return;
  }
  if (!Array.isArray(workout.warmup)) push(issues, `${path}.warmup must be an array`);
  if (!Array.isArray(workout.cooldown)) push(issues, `${path}.cooldown must be an array`);
  if (!Array.isArray(workout.guidance)) push(issues, `${path}.guidance must be an array`);
  if (!Array.isArray(workout.blocks) || workout.blocks.length === 0) {
    push(issues, `${path}.blocks must be a non-empty array`);
    return;
  }
  workout.blocks.forEach((b, i) => validateBlock(b, `${path}.blocks[${i}]`, issues));
}

function validateStage(stage: SessionFamilyStage, familyId: string, issues: string[]): void {
  const path = `family:${familyId} stage:${stage?.id ?? "?"}`;
  if (!stage?.id || typeof stage.id !== "string") {
    push(issues, `${path}: stage id required`);
    return;
  }
  if (/^week\d+$/i.test(stage.id) || /^w\d+$/i.test(stage.id)) {
    push(issues, `${path}: stage id must not encode a calendar week (${stage.id})`);
  }
  if (!stage.key) push(issues, `${path}: key required`);
  if (!stage.label) push(issues, `${path}: label required`);
  if (!Array.isArray(stage.intents) || stage.intents.length === 0) {
    push(issues, `${path}: intents must be a non-empty array`);
  } else {
    for (const intent of stage.intents) {
      if (!DIMENSION_SET.has(intent)) {
        push(issues, `${path}: unknown progression dimension ${String(intent)}`);
      }
    }
  }
  validateStructuredWorkout(stage.structuredWorkout, `${path}.structuredWorkout`, issues);
  if (!Array.isArray(stage.prescriptionSlots) || stage.prescriptionSlots.length === 0) {
    push(issues, `${path}: at least one prescription slot required`);
  } else {
    const seenSlots = new Set<string>();
    for (const slot of stage.prescriptionSlots) {
      if (!SLOT_SET.has(slot.slot)) {
        push(issues, `${path}: unsupported prescription slot ${String(slot.slot)}`);
      }
      if (seenSlots.has(slot.slot)) {
        push(issues, `${path}: duplicate prescription slot ${slot.slot}`);
      }
      seenSlots.add(slot.slot);
      try {
        assertLegalPrescriptionRule(slot.rule);
      } catch (error) {
        const message =
          error instanceof PrescriptionEngineError ? error.message : String(error);
        push(issues, `${path} slot ${slot.slot}: ${message}`);
      }
    }
  }
}

function validateTransition(
  transition: SessionFamilyTransition,
  stageIds: Set<string>,
  familyId: string,
  issues: string[]
): void {
  const path = `family:${familyId} transition ${transition.fromStageId}→${transition.toStageId}`;
  if (!ACTION_SET.has(transition.action)) {
    push(issues, `${path}: illegal action ${String(transition.action)}`);
  }
  if (transition.when && !WHEN_SET.has(transition.when)) {
    push(issues, `${path}: illegal when ${String(transition.when)}`);
  }
  if (!stageIds.has(transition.fromStageId)) {
    push(issues, `${path}: fromStageId not in family`);
  }
  if (!stageIds.has(transition.toStageId)) {
    push(issues, `${path}: toStageId not in family`);
  }
  if (transition.action === "REPEAT" && transition.fromStageId !== transition.toStageId) {
    push(issues, `${path}: REPEAT must target the same stage`);
  }
  if (transition.action === "PROGRESS" && transition.fromStageId === transition.toStageId) {
    push(issues, `${path}: PROGRESS must target a different stage`);
  }
}

/**
 * Validate a SessionFamily definition. Throws SessionFamilyValidationError on failure.
 */
export function assertValidSessionFamily(family: SessionFamily): void {
  const issues = collectSessionFamilyIssues(family);
  if (issues.length > 0) throw new SessionFamilyValidationError(issues);
}

export function collectSessionFamilyIssues(family: SessionFamily): string[] {
  const issues: string[] = [];
  if (!family || typeof family !== "object") {
    return ["family missing"];
  }
  if (!family.id) push(issues, "family.id required");
  if (!family.name) push(issues, "family.name required");
  if (!MODALITY_SET.has(family.modality)) {
    push(issues, `family.modality invalid: ${String(family.modality)}`);
  }
  if (!family.objective) push(issues, "family.objective required");
  if (
    typeof family.definitionVersion !== "number" ||
    !Number.isInteger(family.definitionVersion) ||
    family.definitionVersion < 1
  ) {
    push(issues, "family.definitionVersion must be an integer >= 1");
  }
  if (!Array.isArray(family.stages) || family.stages.length === 0) {
    push(issues, "family.stages must be a non-empty array");
    return issues;
  }

  const stageIds = new Set<string>();
  for (const stage of family.stages) {
    if (stage?.id) {
      if (stageIds.has(stage.id)) {
        push(issues, `duplicate stage id: ${stage.id}`);
      }
      stageIds.add(stage.id);
    }
    validateStage(stage, family.id, issues);
  }

  if (!family.defaultEntryStageId || !stageIds.has(family.defaultEntryStageId)) {
    push(issues, `defaultEntryStageId missing or unknown: ${String(family.defaultEntryStageId)}`);
  }
  if (family.consolidationStageId && !stageIds.has(family.consolidationStageId)) {
    push(issues, `consolidationStageId unknown: ${family.consolidationStageId}`);
  }
  if (family.deloadStageId && !stageIds.has(family.deloadStageId)) {
    push(issues, `deloadStageId unknown: ${family.deloadStageId}`);
  }

  if (!Array.isArray(family.transitions)) {
    push(issues, "family.transitions must be an array");
  } else {
    for (const t of family.transitions) {
      validateTransition(t, stageIds, family.id, issues);
    }
  }

  return issues;
}

export function isValidSessionFamily(family: SessionFamily): boolean {
  return collectSessionFamilyIssues(family).length === 0;
}

/** Pure helper: prove calendar week does not determine stage. */
export function assignStagesToWeeks(
  weekNumbers: number[],
  stageIdsByWeekIndex: string[]
): Array<{ week: number; stageId: string }> {
  if (weekNumbers.length !== stageIdsByWeekIndex.length) {
    throw new SessionFamilyValidationError([
      "weekNumbers and stageIdsByWeekIndex length mismatch",
    ]);
  }
  return weekNumbers.map((week, i) => ({
    week,
    stageId: stageIdsByWeekIndex[i],
  }));
}
