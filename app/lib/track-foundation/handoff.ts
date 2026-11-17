import { currentFiveKForProgramme } from "./anchors";
import type { EvidenceBook } from "./evidence";
import { TRACK_PROGRAMME_ENGINE, TRACK_PROGRAMME_MUTATION_ENABLED } from "./productionBoundary";
import type { AthletePerformanceProfile, EquipmentId, TrackHandoffPreview, TrackIntake } from "./types";

function hoursBand(length: TrackIntake["availability"]["sessionLength"]): TrackHandoffPreview["weeklyHoursBand"] {
  if (length === "under_45") return "3-5";
  if (length === "60_90") return "7-10";
  if (length === "90_plus") return "10+";
  if (length === "45_60") return "5-7";
  return "5-7";
}

function abilityFromFiveK(time: string | null): TrackHandoffPreview["abilityLevel"] {
  if (!time) return "intermediate";
  const parts = time.split(":").map(Number);
  if (parts.length < 2 || parts.some((n) => !Number.isFinite(n))) return "intermediate";
  const seconds = parts.length === 3 ? parts[0]! * 3600 + parts[1]! * 60 + parts[2]! : parts[0]! * 60 + parts[1]!;
  if (seconds <= 21 * 60) return "advanced";
  if (seconds <= 25 * 60) return "intermediate";
  return "beginner";
}

function constraintNotes(intake: TrackIntake): string[] {
  const notes: string[] = [];
  const missing: Array<[EquipmentId, string]> = [
    ["sled", "no sled"],
    ["wall_ball", "no wall ball"],
    ["skierg", "no skierg"],
    ["rower", "no rower"],
  ];
  for (const [id, phrase] of missing) {
    if (!intake.equipment.includes(id)) notes.push(phrase);
  }
  if (intake.pain.severity === "mild_managed" && intake.pain.areas.length > 0) {
    notes.push(`reported pain: ${intake.pain.areas.join(", ")}`);
  }
  if (intake.pain.note) notes.push(intake.pain.note);
  return notes;
}

/**
 * Structured intake for the existing programme generator.
 * Does not call the generator and does not publish anything.
 */
export function buildHandoffPreview(args: {
  intake: TrackIntake;
  book: EvidenceBook;
  profile: AthletePerformanceProfile;
}): TrackHandoffPreview {
  const { intake, book, profile } = args;
  const fiveK = currentFiveKForProgramme(book);
  const blocked = profile.programmingReadiness === "NOT_READY";
  const goalFocus = intake.goal === "running_performance" ? "running" : "hybrid";
  const goalFocusRaw =
    intake.goal === "hyrox"
      ? "HYROX performance"
      : intake.goal === "running_performance"
        ? "Running performance"
        : "Hybrid performance";
  const eventType =
    intake.goal === "hyrox"
      ? intake.event.eventType?.trim() || "HYROX"
      : intake.event.hasEvent
        ? intake.event.eventType
        : null;
  const days =
    intake.availability.availableDays.length > 0
      ? intake.availability.availableDays.length
      : intake.availability.daysPerWeek ?? 0;

  return {
    readyToGenerate: !blocked && TRACK_PROGRAMME_MUTATION_ENABLED === false,
    blockedReason: blocked ? profile.readinessReasons[0] ?? "Not ready" : null,
    goalFocus,
    goalFocusRaw,
    eventType,
    eventDate: intake.event.hasEvent ? intake.event.eventDate : null,
    daysPerWeek: days,
    weeklyHoursBand: hoursBand(intake.availability.sessionLength),
    fiveKTime: fiveK,
    equipment: intake.equipment.includes("gym") ? ["Full gym"] : intake.equipment,
    constraintNotes: constraintNotes(intake),
    abilityLevel: abilityFromFiveK(fiveK),
    abilityNote: fiveK
      ? "Ability is taken from the current 5K. The self-reported training age is ignored."
      : "No current 5K, so ability stays a conservative intermediate default. It is not taken from the self-reported label.",
    engine: TRACK_PROGRAMME_ENGINE,
    mutationEnabled: false,
    published: false,
    persisted: false,
  };
}
