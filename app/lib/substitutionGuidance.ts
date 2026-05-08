import type { ParsedConstraints } from "./parseConstraints";
import type { SessionTemplate, UserEquipment } from "./sessionLibrary";

const NOTE_RUN_NO_DAY =
  "Substitution guidance: if this run cannot happen on the assigned day, move it to your next available run day and avoid placing it directly after heavy lower-body work.";

const NOTE_RUN_LOW_IMPACT =
  "Substitution guidance: if impact feels risky, move the quality work to bike, rower or ski using the same work/rest structure.";

const NOTE_HYBRID_IMPACT =
  "Substitution guidance: keep the effort controlled and reduce impact by swapping jumps/burpees for step-back or machine-based alternatives.";

const NOTE_STRENGTH_LOWER =
  "Substitution guidance: stay pain-free and prioritise controlled range of motion over load.";

const NOTE_TIME_LONG =
  "Substitution guidance: if time is tight, complete the warm-up, main work and first cool-down option before adding extras.";

const NOTE_TIME_DENSITY =
  "Substitution guidance: cap the session by time rather than chasing extra rounds.";

const NOTE_STRENGTH_DB =
  "Substitution guidance: use dumbbell variations for the main lift patterns and keep the intent of the session the same.";

const NOTE_HYBRID_STATION =
  "Substitution guidance: if a station is unavailable, match the intent with a similar movement pattern and effort level rather than forcing the exact exercise.";

const NOTE_NO_SLED =
  "Substitution guidance: if no sled is available, use heavy walking lunges, leg press, wall sits or loaded carries to mimic lower-body pressure.";

const NOTE_NO_SKIERG =
  "Substitution guidance: replace ski work with rower or bike intervals at the same effort.";

const NOTE_NO_ROW =
  "Substitution guidance: replace rowing with bike or ski work at the same effort and duration.";

function hasFlag(parsed: ParsedConstraints, flag: string): boolean {
  return parsed.flags.includes(flag);
}

function sessionTextBlob(session: SessionTemplate): string {
  const chunks: string[] = [
    session.name,
    session.coaching.intent,
    session.coaching.cue,
    session.coaching.rpe,
    ...(session.prescription.warm_up ?? []),
    ...(session.prescription.main ?? []),
    ...(session.prescription.cool_down ?? []),
    ...(session.prescription.finish ?? []),
    ...(session.prescription.notes ?? []),
  ];
  return chunks.join(" ").toLowerCase();
}

function mentionsSkiEquip(blob: string): boolean {
  return /\bskierg\b|ski erg|ski-erg|\bski machine\b/i.test(blob);
}

function mentionsRowing(blob: string): boolean {
  return /\brower\b|\browing\b|\brow\s+\d|\b\d+m\s*row\b|row sprint|rowing interval/i.test(blob);
}

function mentionsSled(blob: string): boolean {
  return /\bsled\b|\bprowler\b/i.test(blob);
}

function mentionsHighLegImpactHybrid(blob: string): boolean {
  return /\bburpees?\b|\blunge|\bjump\b|box jump|squat jump|plyo\b/i.test(blob);
}

export function buildSubstitutionNotes({
  parsedConstraints,
  equipment,
  session,
}: {
  parsedConstraints: ParsedConstraints;
  equipment: UserEquipment[];
  session: SessionTemplate;
}): string[] {
  if (session.category === "recovery") {
    return [];
  }

  const ordered: string[] = [];

  if (
    parsedConstraints.no_running_days.length > 0 &&
    session.category === "run"
  ) {
    ordered.push(NOTE_RUN_NO_DAY);
  }

  const lowImpactContext =
    hasFlag(parsedConstraints, "injury_flags") ||
    hasFlag(parsedConstraints, "low_impact_preference");
  if (lowImpactContext) {
    if (session.category === "run" && session.intensity === "high") {
      ordered.push(NOTE_RUN_LOW_IMPACT);
    } else if (session.category === "hybrid") {
      const blob = sessionTextBlob(session);
      if (mentionsHighLegImpactHybrid(blob)) {
        ordered.push(NOTE_HYBRID_IMPACT);
      }
    } else if (
      session.category === "strength" &&
      (session.type === "strength_lower" || session.type === "strength_full")
    ) {
      ordered.push(NOTE_STRENGTH_LOWER);
    }
  }

  if (hasFlag(parsedConstraints, "time_limit")) {
    if (session.type === "hybrid_density") {
      ordered.push(NOTE_TIME_DENSITY);
    } else if (session.duration > 45 || session.time_requirement === "75+") {
      ordered.push(NOTE_TIME_LONG);
    }
  }

  if (!equipment.includes("Full gym")) {
    const equipNote = pickEquipmentNote(equipment, session);
    if (equipNote) ordered.push(equipNote);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of ordered) {
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
    if (out.length >= 2) break;
  }
  return out;
}

/** One equipment-tier note when equipment is limited (caller ensures not Full gym). */
function pickEquipmentNote(
  equipment: UserEquipment[],
  session: SessionTemplate
): string | null {
  const blob = sessionTextBlob(session);

  if (session.category === "strength" && equipment.includes("Dumbbells only")) {
    return NOTE_STRENGTH_DB;
  }

  if (session.category === "hybrid") {
    if (!equipment.includes("Sled") && mentionsSled(blob)) {
      return NOTE_NO_SLED;
    }
    if (!equipment.includes("SkiErg") && mentionsSkiEquip(blob)) {
      return NOTE_NO_SKIERG;
    }
    if (!equipment.includes("Rower") && mentionsRowing(blob)) {
      return NOTE_NO_ROW;
    }
    return NOTE_HYBRID_STATION;
  }

  if (!equipment.includes("SkiErg") && mentionsSkiEquip(blob)) {
    return NOTE_NO_SKIERG;
  }
  if (!equipment.includes("Rower") && mentionsRowing(blob)) {
    return NOTE_NO_ROW;
  }

  return null;
}
