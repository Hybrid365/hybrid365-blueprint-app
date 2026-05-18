/**
 * HYROX track context for paid community programmes.
 * Bridges assessment + benchmarks into session bias, progression families, and coach copy.
 * Not 1-1 coaching — inherits core methodology from src/lib/hyrox where useful.
 */

import type { BlueprintInput } from "./buildWeekBlueprint";
import type { SessionTemplate, StructureRole } from "./sessionLibrary";
import type { BenchmarkSignals } from "./paidProgrammeIntelligence";
import { parseEventSpecificity } from "./paidProgrammeIntelligence";
import { rotateStationFocusForBlock } from "@/src/lib/hyrox/stationPersonalisation";
import type { StationWeakness } from "@/src/lib/hyrox/types";
import { weeksToRacePhase } from "@/src/lib/hyrox/weeklyStructureRules";

export type HyroxEventType = "open" | "pro" | "doubles" | "relay" | "unknown";
export type HyroxTimeline = "general" | "base" | "build" | "race_specific" | "taper";

export type HyroxTrackContext = {
  active: boolean;
  hyrox_event_type: HyroxEventType;
  hyrox_race_date: string | null;
  hyrox_timeline: HyroxTimeline;
  station_weaknesses: StationWeakness[];
  station_focus_this_week: StationWeakness[];
  equipment: {
    hasFullGym: boolean;
    hasSled: boolean;
    hasWallBall: boolean;
    hasSkiErg: boolean;
    hasRowErg: boolean;
    hasBike: boolean;
  };
  equipment_limited: boolean;
  equipment_note: string | null;
  five_k_time: string | null;
  max_heart_rate: number | null;
  current_run_volume_band: string | null;
  skierg_benchmark: string | null;
  row_benchmark: string | null;
  impact_risk: "low" | "moderate" | "high";
  programme_block: 1 | 2 | 3;
  block_week_in_cycle: 1 | 2 | 3 | 4;
  phase_emphasis: string;
};

export type HyroxAssessmentSlice = {
  goal_focus?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  biggest_limiter?: string | null;
  injury_flags?: string[] | null;
  movements_to_avoid?: string[] | null;
  notes?: string | null;
  equipment?: string[] | null;
  recent_5k_time?: string | null;
  current_run_volume_band?: string | null;
  max_heart_rate?: number | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** True when athlete selected HYROX goal and/or a HYROX event — not general hybrid only. */
export function detectHyroxTrack(args: {
  goal_focus_raw?: string | null;
  event_type?: string | null;
}): boolean {
  const event = norm(args.event_type);
  const goal = norm(args.goal_focus_raw);

  if (/hyrox\s+(open|pro|double|relay)/.test(event)) return true;
  if (event.includes("hyrox")) return true;
  if (/improve hybrid.*hyrox|hyrox performance/.test(goal)) return true;
  if (/prepare for a specific event/.test(goal) && event.includes("hyrox")) return true;

  return false;
}

export function parseHyroxEventType(eventType: string | null | undefined): HyroxEventType {
  const spec = parseEventSpecificity(eventType);
  if (spec === "hyrox_pro") return "pro";
  if (spec === "hyrox_open") return "open";
  if (spec === "hyrox_doubles") return "doubles";
  const t = norm(eventType);
  if (t.includes("relay")) return "relay";
  if (t.includes("hyrox")) return "open";
  return "unknown";
}

export function parseStationWeaknessesFromText(blob: string): StationWeakness[] {
  const b = blob.toLowerCase();
  const out: StationWeakness[] = [];
  if (/wall\s*ball/.test(b)) out.push("wall_balls");
  if (/sled/.test(b)) out.push("sled_push_pull");
  if (/burpee/.test(b)) out.push("burpees");
  if (/lunge|sandbag/.test(b)) out.push("lunges");
  if (/ski\s*erg|skierg|\bski\b/.test(b)) out.push("ski");
  if (/\brow\b|rower|row\s*erg/.test(b)) out.push("row");
  if (/farmer|carry|grip/.test(b)) out.push("farmers_carry");
  if (/running under fatigue|fatigue after stations|hold pace after|compromised run/.test(b)) {
    out.push("running_under_fatigue");
  }
  return [...new Set(out)];
}

function weeksUntilRace(eventDate: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate.trim());
  if (!m) return null;
  const race = new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00Z`);
  const now = new Date();
  const diff = race.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)));
}

export function resolveHyroxTimeline(
  weekNumber: number,
  eventDate: string | null,
  weekFocus?: string | null
): HyroxTimeline {
  if (weekFocus?.includes("deload")) return "base";
  if (weekNumber === 12 || weekFocus?.includes("taper") || weekFocus?.includes("test")) return "taper";
  if (weekNumber === 4 || weekNumber === 8) return "base";

  const weeksOut = eventDate ? weeksUntilRace(eventDate) : null;
  if (weeksOut != null) {
    const phase = weeksToRacePhase(weeksOut);
    if (phase === "race_week") return "taper";
    if (phase === "near") return "race_specific";
    if (phase === "mid") return weekNumber >= 9 ? "race_specific" : "build";
    return weekNumber <= 4 ? "base" : weekNumber <= 8 ? "build" : "race_specific";
  }

  if (weekNumber <= 3) return "base";
  if (weekNumber <= 7) return "build";
  if (weekNumber <= 11) return "race_specific";
  return "taper";
}

function phaseEmphasisCopy(timeline: HyroxTimeline, blockWeek: number): string {
  if (timeline === "taper") {
    return "Taper / race-readiness — keep sessions sharp, not exhausting.";
  }
  if (timeline === "race_specific") {
    return "Race-specific density — compromised running and station transitions matter most.";
  }
  if (timeline === "build") {
    return "Build phase — more threshold volume and compromised running under control.";
  }
  if (blockWeek === 4) {
    return "Control week — absorb load while keeping rhythm.";
  }
  return "Base phase — aerobic foundation, threshold control, and station tolerance.";
}

function parseEquipmentFlags(equipment: string[] | undefined, notesBlob: string) {
  const eq = (equipment ?? []).join(" ").toLowerCase();
  const blob = notesBlob.toLowerCase();
  const hasFullGym = /full gym/.test(eq) || (!eq && !/no gym|bodyweight only|minimal/.test(blob));
  const avoidsSled = /no sled/.test(blob);
  const avoidsWall = /no wall\s*ball/.test(blob);
  const avoidsSki = /no ski|no skierg/.test(blob);
  const avoidsRow = /no row|no rower/.test(blob);

  const hasSled = hasFullGym && !avoidsSled && !/minimal|home gym|outdoor only/.test(eq);
  const hasWallBall = hasFullGym && !avoidsWall;
  const hasSkiErg = (hasFullGym || /home gym/.test(eq)) && !avoidsSki;
  const hasRowErg = (hasFullGym || /home gym/.test(eq)) && !avoidsRow;
  const hasBike = hasFullGym || /home gym|bike/.test(eq);

  const equipment_limited =
    !hasSled || !hasWallBall || (!hasSkiErg && !hasRowErg);

  let equipment_note: string | null = null;
  if (equipment_limited) {
    const missing: string[] = [];
    if (!hasSled) missing.push("sled");
    if (!hasWallBall) missing.push("wall ball");
    if (!hasSkiErg && !hasRowErg) missing.push("SkiErg/RowErg");
    equipment_note = `Limited HYROX equipment (${missing.join(", ")}) — sessions use the closest substitutes available. Race specificity is reduced until you can access full kit.`;
  }

  return {
    hasFullGym,
    hasSled,
    hasWallBall,
    hasSkiErg,
    hasRowErg,
    hasBike,
    equipment_limited,
    equipment_note,
  };
}

export function buildHyroxTrackContext(args: {
  assessment: HyroxAssessmentSlice;
  benchmark_signals?: BenchmarkSignals;
  has_injury?: boolean;
  parsed_flags?: string[];
  modality_avoids?: { sled?: boolean; rower?: boolean; ski?: boolean };
}): HyroxTrackContext | null {
  if (
    !detectHyroxTrack({
      goal_focus_raw: args.assessment.goal_focus,
      event_type: args.assessment.event_type,
    })
  ) {
    return null;
  }

  const blob = [
    args.assessment.biggest_limiter,
    args.assessment.notes,
    ...(args.assessment.injury_flags ?? []),
    ...(args.assessment.movements_to_avoid ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  let station_weaknesses = parseStationWeaknessesFromText(blob);
  if (station_weaknesses.length === 0 && /station|hyrox/.test(norm(args.assessment.biggest_limiter))) {
    station_weaknesses = ["running_under_fatigue"];
  }

  const equipmentParsed = parseEquipmentFlags(args.assessment.equipment ?? undefined, blob);
  if (args.modality_avoids?.sled) equipmentParsed.hasSled = false;
  if (args.modality_avoids?.ski) equipmentParsed.hasSkiErg = false;
  if (args.modality_avoids?.rower) equipmentParsed.hasRowErg = false;

  const injuryHigh =
    Boolean(args.has_injury) ||
    Boolean(args.parsed_flags?.includes("injury_flags")) ||
    Boolean(args.parsed_flags?.includes("low_impact_preference"));

  return {
    active: true,
    hyrox_event_type: parseHyroxEventType(args.assessment.event_type),
    hyrox_race_date: args.assessment.event_date?.trim() || null,
    hyrox_timeline: "general",
    station_weaknesses,
    station_focus_this_week: station_weaknesses.slice(0, 1),
    equipment: {
      hasFullGym: equipmentParsed.hasFullGym,
      hasSled: equipmentParsed.hasSled,
      hasWallBall: equipmentParsed.hasWallBall,
      hasSkiErg: equipmentParsed.hasSkiErg,
      hasRowErg: equipmentParsed.hasRowErg,
      hasBike: equipmentParsed.hasBike,
    },
    equipment_limited: equipmentParsed.equipment_limited,
    equipment_note: equipmentParsed.equipment_note,
    five_k_time: args.assessment.recent_5k_time?.trim() || args.benchmark_signals?.latest_5k || null,
    max_heart_rate:
      typeof args.assessment.max_heart_rate === "number" ? args.assessment.max_heart_rate : null,
    current_run_volume_band: args.assessment.current_run_volume_band?.trim() || null,
    skierg_benchmark: args.benchmark_signals?.latest_skierg ?? null,
    row_benchmark: args.benchmark_signals?.latest_row ?? null,
    impact_risk: injuryHigh ? "high" : equipmentParsed.equipment_limited ? "moderate" : "low",
    programme_block: 1,
    block_week_in_cycle: 1,
    phase_emphasis: phaseEmphasisCopy("base", 1),
  };
}

/** Per-week enrichment (timeline, rotated station focus, block labels). */
export function hyroxContextForWeek(
  base: HyroxTrackContext,
  weekNumber: number,
  weekFocus?: string | null
): HyroxTrackContext {
  const block_week_in_cycle = (((weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
  const programme_block: 1 | 2 | 3 =
    weekNumber <= 4 ? 1 : weekNumber <= 8 ? 2 : 3;
  const hyrox_timeline = resolveHyroxTimeline(weekNumber, base.hyrox_race_date, weekFocus);
  const station_focus_this_week = rotateStationFocusForBlock(
    base.station_weaknesses.length > 0 ? base.station_weaknesses : (["running_under_fatigue"] as StationWeakness[]),
    block_week_in_cycle
  );

  return {
    ...base,
    programme_block,
    block_week_in_cycle,
    hyrox_timeline,
    station_focus_this_week,
    phase_emphasis: phaseEmphasisCopy(hyrox_timeline, block_week_in_cycle),
  };
}

function sessionBlob(s: SessionTemplate): string {
  return `${s.name} ${s.prescription.main?.join(" ") ?? ""}`.toLowerCase();
}

function matchesWeakness(weakness: StationWeakness, s: SessionTemplate): boolean {
  const b = sessionBlob(s);
  switch (weakness) {
    case "wall_balls":
    case "wall_ball":
      return /wall\s*ball/.test(b);
    case "sled":
    case "sled_push_pull":
      return /sled/.test(b);
    case "burpees":
      return /burpee/.test(b);
    case "lunges":
      return /lunge|sandbag/.test(b);
    case "ski":
      return /\bski\b|skierg|ski erg/.test(b);
    case "row":
      return /\brow\b|rower|rowing/.test(b);
    case "farmers_carry":
    case "carry":
      return /farmer|carry|grip/.test(b);
    case "running_under_fatigue":
      return /compromised|hyrox|station.*run|run.*station/.test(b);
    default:
      return false;
  }
}

function requiresUnavailableEquipment(s: SessionTemplate, ctx: HyroxTrackContext): boolean {
  const eq = s.equipment ?? [];
  const needsSled = eq.includes("Sled");
  const needsWall = /wall ball/i.test(sessionBlob(s));
  const needsSki = eq.includes("SkiErg");
  const needsRow = eq.includes("Rower");
  if (needsSled && !ctx.equipment.hasSled) return true;
  if (needsWall && !ctx.equipment.hasWallBall) return true;
  if (needsSki && !ctx.equipment.hasSkiErg && !ctx.equipment.hasBike) return true;
  if (needsRow && !ctx.equipment.hasRowErg && !ctx.equipment.hasBike) return true;
  return false;
}

/** Weight delta for pickWeightedSession when HYROX track is active. */
export function hyroxSessionWeightDelta(
  ctx: HyroxTrackContext,
  weekNumber: number,
  s: SessionTemplate,
  role: StructureRole
): number {
  if (!ctx.active) return 0;

  const ctxW = hyroxContextForWeek(ctx, weekNumber);
  let w = 0;
  const timeline = ctxW.hyrox_timeline;
  const nameLc = s.name.toLowerCase();
  const blob = sessionBlob(s);

  if (s.id.startsWith("HYX-") || nameLc.includes("hyrox")) w += 6;

  if (timeline === "base" || timeline === "general") {
    if (s.type === "threshold_run") w += 10;
    if (s.type === "aerobic_run" || s.type === "long_run") w += 4;
    if (s.type === "hybrid_compromised" && s.fatigue !== "high") w += 4;
    if (/\bfull race\b|race simulation|8\s*rounds/i.test(blob)) w -= 12;
  } else if (timeline === "build") {
    if (s.type === "threshold_run") w += 12;
    if (s.type === "hybrid_compromised") w += 8;
    if (s.type === "hybrid_density") w += 5;
    if (s.type === "aerobic_support" && /ski|row|erg/i.test(blob)) w += 4;
  } else if (timeline === "race_specific") {
    if (s.type === "hybrid_compromised") w += 14;
    if (s.type === "hybrid_density") w += 10;
    if (/\bcompromised|race.?pace|transition/i.test(blob)) w += 6;
    if (role === "hybrid_primary") w += 5;
  } else if (timeline === "taper") {
    if (s.fatigue === "high" && s.duration >= 55) w -= 8;
    if (s.type === "threshold_run" && s.duration <= 50) w += 4;
  }

  if (ctxW.hyrox_event_type === "pro") {
    if (s.type === "hybrid_compromised" && timeline !== "base") w += 3;
    if (s.type === "strength_lower" && /sled|heavy|loaded/i.test(blob)) w += 2;
  }

  for (const weakness of ctxW.station_focus_this_week) {
    if (matchesWeakness(weakness, s)) w += 14;
  }

  if (ctxW.equipment_limited) {
    if (requiresUnavailableEquipment(s, ctxW)) w -= 90;
    if (s.equipment.includes("Bike / Spin bike") && (!ctxW.equipment.hasSkiErg || !ctxW.equipment.hasRowErg)) {
      w += 6;
    }
    if (s.type === "hybrid_bodyweight" && !/sled|wall ball/i.test(blob)) w += 4;
  }

  if (ctxW.impact_risk === "high") {
    if (s.type === "hybrid_compromised" && /\bburpee|jump|sled push/i.test(blob)) w -= 4;
    if (s.variation_group === "hybrid_low_impact") w += 8;
  }

  if (role === "hybrid_density" && s.type === "hybrid_density") w += 6;
  if (role === "hybrid_primary" && s.type === "hybrid_compromised") w += 5;

  return w;
}

export function hyroxWeeklyStructureBoost(structureLabel: string): number {
  if (/hyrox priority/i.test(structureLabel)) return 18;
  if (/hyrox advanced/i.test(structureLabel)) return 14;
  return 0;
}

/** Progression family id for HYROX hybrid roles (resolved via getProgressionFamily). */
export function resolveHyroxProgressionFamilyId(
  role: string,
  ctx: HyroxTrackContext,
  weekNumber: number,
  weekFocus: string | null | undefined
): string | null {
  if (!ctx.active) return null;
  const ctxW = hyroxContextForWeek(ctx, weekNumber, weekFocus);
  const focus = ctxW.station_focus_this_week[0];

  if (role === "hybrid_primary") return "compromised_run_a";

  if (role === "lower_primary" || role === "lower_full") {
    if (ctxW.equipment_limited && !ctxW.equipment.hasSled) {
      return "lower_strength_foundation_a";
    }
    return "lower_strength_hyrox_endurance_a";
  }

  if (role === "hybrid_density") {
    if (focus === "wall_balls" || focus === "wall_ball") return "wall_ball_durability_a";
    if (focus === "burpees" || focus === "lunges" || focus === "running_under_fatigue") {
      return "compromised_run_a";
    }
    if (focus === "sled" || focus === "sled_push_pull") {
      return ctxW.equipment.hasSled ? "lower_strength_hyrox_endurance_a" : "compromised_run_a";
    }
    return "wall_ball_durability_a";
  }

  return null;
}

export function buildHyroxWeekCoachingParagraph(args: {
  ctx: HyroxTrackContext;
  weekNumber: number;
  weekFocus?: string | null;
  schedule: Array<{ title: string; tags?: string[]; progression_family?: string }>;
}): string {
  const ctxW = hyroxContextForWeek(args.ctx, args.weekNumber, args.weekFocus);
  const hasThreshold = args.schedule.some((d) => (d.tags?.[0] ?? "") === "threshold_run");
  const hasCompromised = args.schedule.some(
    (d) =>
      (d.tags?.[0] ?? "") === "hybrid_compromised" ||
      /compromised|hyrox/i.test(d.title)
  );
  const focusLabel =
    ctxW.station_focus_this_week[0]?.replace(/_/g, " ") ?? "race readiness";

  const eventLabel =
    ctxW.hyrox_event_type === "pro"
      ? "Hyrox Pro"
      : ctxW.hyrox_event_type === "doubles"
        ? "Hyrox Doubles"
        : ctxW.hyrox_event_type === "open"
          ? "Hyrox Open"
          : "Hyrox";

  const parts: string[] = [];

  parts.push(
    `${eventLabel} track — ${ctxW.phase_emphasis} This week targets ${focusLabel} while keeping hard/easy spacing honest.`
  );

  if (hasThreshold) {
    parts.push(
      "Threshold work (run and/or ergs) develops control you can repeat after stations — not a one-off sprint."
    );
    parts.push(
      "Run threshold remains the anchor. Extra threshold volume is added through ergs/bike to build the engine without unnecessary impact."
    );
  }
  if (hasCompromised) {
    parts.push(
      "The compromised session builds running-under-fatigue tolerance without turning the whole week into a race simulation too early."
    );
  }
  if (ctxW.equipment_note) {
    parts.push(ctxW.equipment_note);
  }
  if (ctxW.hyrox_event_type === "pro" && ctxW.hyrox_timeline !== "base") {
    parts.push("Pro weights: prioritise quality under load — race-pace efforts, not daily max outs.");
  }

  return parts.join(" ");
}

export function hyroxTrackSummaryForRationale(ctx: HyroxTrackContext): string[] {
  const lines: string[] = [];
  lines.push(
    `HYROX ${ctx.hyrox_event_type} programming — phased plan with threshold running, compromised work, and station durability.`
  );
  if (ctx.station_weaknesses.length) {
    lines.push(
      `Station focus rotates across the block: ${ctx.station_weaknesses.map((w) => w.replace(/_/g, " ")).join(", ")}.`
    );
  }
  if (ctx.equipment_note) lines.push(ctx.equipment_note);
  if (ctx.skierg_benchmark) lines.push(`SkiErg benchmark: ${ctx.skierg_benchmark}.`);
  if (ctx.row_benchmark) lines.push(`Row benchmark: ${ctx.row_benchmark}.`);
  return lines;
}
