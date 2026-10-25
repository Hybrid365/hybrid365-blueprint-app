/**
 * Default progression block proposals (coach can edit before apply).
 * Stage path uses coach_default_block edges + consolidation — never week-as-stage.
 */

import {
  THRESHOLD_5MIN_FAMILY_ID,
  THRESHOLD_5MIN_STAGE_IDS,
} from "@/app/lib/families/threshold5MinRepeats";
import { getSessionFamily } from "@/app/lib/hyroxSessionFamilyRegistry";
import type { SessionFamily } from "@/app/lib/hyroxSessionFamilyTypes";

export type ProgressionBlockLength = 3 | 4;

export type ProgressionWeekProposal = {
  /** 0-based index within the assignment block */
  offset: number;
  /** Display label Week 1..N of the assignment (not programme calendar week) */
  label: string;
  stageId: string;
};

/**
 * Default stage sequence from an entry stage along PROGRESS coach_default_block edges.
 * Final week of a 4-week block defaults to Consolidation when available (coach can change).
 * Never hardcodes "week 4 = deload".
 */
export function proposeDefaultProgressionStages(args: {
  family: SessionFamily;
  entryStageId: string;
  blockLength: ProgressionBlockLength;
}): ProgressionWeekProposal[] {
  const { family, entryStageId, blockLength } = args;
  const stageIds = new Set(family.stages.map((s) => s.id));
  if (!stageIds.has(entryStageId)) {
    throw new Error(`Unknown entry stage ${entryStageId}`);
  }

  const progressEdge = new Map<string, string>();
  for (const t of family.transitions) {
    if (t.action === "PROGRESS" && t.when === "coach_default_block") {
      progressEdge.set(t.fromStageId, t.toStageId);
    }
  }

  const sequence: string[] = [entryStageId];
  while (sequence.length < blockLength) {
    const last = sequence[sequence.length - 1];
    const next = progressEdge.get(last);
    if (!next || sequence.includes(next)) break;
    sequence.push(next);
  }

  // Pad by repeating last working stage if path shorter than block
  while (sequence.length < blockLength) {
    sequence.push(sequence[sequence.length - 1]);
  }

  // 4-week default: last week → consolidation when defined and entry wasn't already consolidating
  if (
    blockLength === 4 &&
    family.consolidationStageId &&
    sequence[3] !== family.consolidationStageId &&
    sequence[3] !== family.deloadStageId
  ) {
    sequence[3] = family.consolidationStageId;
  }

  return sequence.slice(0, blockLength).map((stageId, offset) => ({
    offset,
    label: `Week ${offset + 1}`,
    stageId,
  }));
}

export function listPilotSessionFamilies(): SessionFamily[] {
  const family = getSessionFamily(THRESHOLD_5MIN_FAMILY_ID);
  return family ? [family] : [];
}

export function formatStageKeyShort(stageKey: string): string {
  if (stageKey.startsWith("stage_")) return `S${stageKey.replace("stage_", "")}`;
  if (stageKey === "consolidation") return "Consol";
  if (stageKey.startsWith("deload")) return "Deload";
  return stageKey;
}

export { THRESHOLD_5MIN_FAMILY_ID, THRESHOLD_5MIN_STAGE_IDS };
