/**
 * Extract athlete-safe StructuredWorkout from published prescription JSON.
 * Returns the AST only — never familyId / stageId / Stage N metadata.
 */

import type { StructuredWorkout } from "@/app/lib/hyroxSessionFamilyTypes";

function isWorkSpec(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const w = value as Record<string, unknown>;
  return (
    (w.kind === "time" && w.unit === "sec" && typeof w.value === "number") ||
    (w.kind === "distance" &&
      (w.unit === "m" || w.unit === "km") &&
      typeof w.value === "number")
  );
}

function looksLikeStructuredWorkout(value: unknown): value is StructuredWorkout {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const w = value as Record<string, unknown>;
  if (!Array.isArray(w.blocks)) return false;
  return w.blocks.every((b) => {
    if (!b || typeof b !== "object" || Array.isArray(b)) return false;
    const block = b as Record<string, unknown>;
    if (block.type === "repeat") {
      return (
        typeof block.reps === "number" &&
        isWorkSpec(block.work) &&
        Array.isArray(block.recoveries)
      );
    }
    if (block.type === "continuous") return isWorkSpec(block.work);
    if (block.type === "station_round") return typeof block.rounds === "number";
    if (block.type === "strength") return Array.isArray(block.exercises);
    return false;
  });
}

/**
 * Prefer published sessionFamily.structuredWorkout, then editConfig.structuredWorkout.
 */
export function extractAthleteStructuredWorkout(
  prescription: unknown
): StructuredWorkout | null {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
    return null;
  }
  const p = prescription as Record<string, unknown>;

  const family = p.sessionFamily;
  if (family && typeof family === "object" && !Array.isArray(family)) {
    const sw = (family as Record<string, unknown>).structuredWorkout;
    if (looksLikeStructuredWorkout(sw)) {
      return {
        warmup: Array.isArray(sw.warmup) ? [...sw.warmup] : [],
        blocks: structuredClone(sw.blocks),
        cooldown: Array.isArray(sw.cooldown) ? [...sw.cooldown] : [],
        guidance: Array.isArray(sw.guidance) ? [...sw.guidance] : [],
      };
    }
  }

  const edit = p.editConfig;
  if (edit && typeof edit === "object" && !Array.isArray(edit)) {
    const sw = (edit as Record<string, unknown>).structuredWorkout;
    if (looksLikeStructuredWorkout(sw)) {
      return {
        warmup: Array.isArray(sw.warmup) ? [...sw.warmup] : [],
        blocks: structuredClone(sw.blocks),
        cooldown: Array.isArray(sw.cooldown) ? [...sw.cooldown] : [],
        guidance: Array.isArray(sw.guidance) ? [...sw.guidance] : [],
      };
    }
  }

  return null;
}

/** Optional family modality string from publish snapshot — for inference only. */
export function extractPublishedFamilyModality(prescription: unknown): string | null {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) {
    return null;
  }
  const family = (prescription as Record<string, unknown>).sessionFamily;
  if (!family || typeof family !== "object" || Array.isArray(family)) return null;
  const mod = (family as Record<string, unknown>).modality;
  return typeof mod === "string" && mod.trim() ? mod.trim() : null;
}
