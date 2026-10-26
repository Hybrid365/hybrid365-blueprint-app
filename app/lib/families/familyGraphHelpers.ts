/**
 * Shared helpers for SessionFamily stage graphs.
 * Stage ≠ calendar week. One meaningful dimension per PROGRESS step.
 */

import type {
  SessionFamilyTransition,
  SessionFamilyTransitionAction,
  SessionFamilyTransitionWhen,
} from "@/app/lib/hyroxSessionFamilyTypes";

export function edge(
  fromStageId: string,
  action: SessionFamilyTransitionAction,
  toStageId: string,
  when?: SessionFamilyTransitionWhen
): SessionFamilyTransition {
  return { fromStageId, action, toStageId, when };
}

/**
 * Standard linear working path + REPEAT on all + REDUCE back one + DELOAD hub.
 * `workingIds` ordered stage_1 → stage_N. Optional consolidation + deload.
 */
export function buildStandardFamilyTransitions(args: {
  workingIds: string[];
  consolidationId?: string;
  deloadId?: string;
}): SessionFamilyTransition[] {
  const { workingIds, consolidationId, deloadId } = args;
  const out: SessionFamilyTransition[] = [];

  for (let i = 0; i < workingIds.length - 1; i++) {
    out.push(edge(workingIds[i], "PROGRESS", workingIds[i + 1], "coach_default_block"));
  }

  for (const id of workingIds) {
    out.push(edge(id, "REPEAT", id, "manual_only"));
  }
  if (consolidationId) out.push(edge(consolidationId, "REPEAT", consolidationId, "manual_only"));
  if (deloadId) out.push(edge(deloadId, "REPEAT", deloadId, "manual_only"));

  for (let i = 1; i < workingIds.length; i++) {
    out.push(edge(workingIds[i], "REDUCE", workingIds[i - 1], "feedback_suggest"));
  }
  if (consolidationId && workingIds.length >= 2) {
    out.push(
      edge(consolidationId, "REDUCE", workingIds[Math.max(0, workingIds.length - 2)], "feedback_suggest")
    );
  }

  if (deloadId) {
    for (const id of workingIds) {
      out.push(edge(id, "DELOAD", deloadId, "manual_only"));
    }
    if (consolidationId) out.push(edge(consolidationId, "DELOAD", deloadId, "manual_only"));
    // Return from deload into early/mid working stage
    const returnTo = workingIds[Math.min(1, workingIds.length - 1)];
    out.push(edge(deloadId, "PROGRESS", returnTo, "manual_only"));
  }

  if (consolidationId && workingIds.length) {
    const last = workingIds[workingIds.length - 1];
    out.push(edge(last, "SKIP_TO", consolidationId, "manual_only"));
    if (workingIds.length >= 2) {
      out.push(edge(workingIds[workingIds.length - 2], "SKIP_TO", consolidationId, "manual_only"));
    }
    out.push(edge(consolidationId, "PROGRESS", last, "manual_only"));
  }

  return out;
}

export const HYROX_RUN_RULE = {
  basis: "hyrox_run_pace" as const,
  adjustment: { type: "identity" as const },
};

export const THRESHOLD_PACE_RULE = {
  basis: "threshold_pace" as const,
  adjustment: { type: "seconds_per_km" as const, value: 5 },
};

/** Tempo typically sits ~10–20s/km slower than threshold — explicit offset, not a silent estimate. */
export const TEMPO_PACE_RULE = {
  basis: "threshold_pace" as const,
  adjustment: { type: "seconds_per_km" as const, value: 15 },
};

export const SKI_SPLIT_RULE = {
  basis: "ski_2k_split" as const,
  adjustment: { type: "seconds_per_500m" as const, value: 2 },
};

export const ROW_SPLIT_RULE = {
  basis: "row_2k_split" as const,
  adjustment: { type: "seconds_per_500m" as const, value: 2 },
};
