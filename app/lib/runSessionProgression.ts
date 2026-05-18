import type { SessionTemplate } from "./sessionLibrary";
import type { AbilityLevel } from "./sessionLibrary";
import type { DayKey } from "./sessionLibrary";
import {
  applyProgressionFamily,
  resolveRunProgressionFamily,
  type AppliedProgression,
} from "./progressionFamilies";

export type RunProgressionSlot = "threshold" | "interval" | "long" | "easy";

export type WeekRunSnapshot = {
  slot: RunProgressionSlot | "other";
  sessionId: string;
  sessionName: string;
  fingerprint: string;
  day?: string;
};

export type RunProgressionContext = {
  slot: RunProgressionSlot;
  weekNumber: number;
  weekFocus?: string | null;
  abilityLevel: AbilityLevel;
  assignedDay?: DayKey;
  lowImpact?: boolean;
  /** Prior week snapshots for duplicate guard */
  previousWeekSnapshots?: WeekRunSnapshot[];
  /** Same-week picks already made */
  sameWeekSnapshots?: WeekRunSnapshot[];
};

function blockWeekIndex(weekNumber: number): 1 | 2 | 3 | 4 {
  return (((weekNumber - 1) % 4) + 1) as 1 | 2 | 3 | 4;
}

function isDeloadWeek(weekNumber: number, weekFocus?: string | null): boolean {
  if (weekFocus?.includes("deload")) return true;
  return blockWeekIndex(weekNumber) === 4;
}

export function resolveRunAppliedProgression(
  ctx: RunProgressionContext,
  input: { ability_level: AbilityLevel; has_injury?: boolean }
): AppliedProgression | null {
  const lowImpact = Boolean(ctx.lowImpact || input.has_injury);
  const family = resolveRunProgressionFamily(
    ctx.slot,
    input as import("./buildWeekBlueprint").BlueprintInput,
    ctx.weekNumber,
    ctx.weekFocus,
    lowImpact
  );
  if (!family) return null;
  return applyProgressionFamily(family, ctx.weekNumber, ctx.weekFocus);
}

/** Preferred library template id for this slot + week (from progression family). */
export function preferredTemplateIdForRunSlot(
  ctx: RunProgressionContext,
  input?: { ability_level: AbilityLevel; has_injury?: boolean }
): string | null {
  if (!input) return null;
  const applied = resolveRunAppliedProgression(ctx, input);
  return applied?.variant.template_id ?? null;
}

export function sessionFingerprint(session: SessionTemplate): string {
  const main = (session.prescription.main ?? []).join("|").toLowerCase().replace(/\s+/g, " ");
  return `${session.id}::${session.name.trim().toLowerCase()}::${main}`;
}

export function extractWeekRunSnapshots(
  schedule: { day: string; title: string; template_id?: string; tags?: string[]; session?: { main?: string[] } }[]
): WeekRunSnapshot[] {
  const out: WeekRunSnapshot[] = [];
  for (const day of schedule) {
    const t0 = day.tags?.[0] ?? "";
    let slot: WeekRunSnapshot["slot"] = "other";
    if (t0 === "threshold_run") slot = "threshold";
    else if (t0 === "interval_run") slot = "interval";
    else if (t0 === "long_run") slot = "long";
    else if (t0 === "aerobic_run" || day.title === "Aerobic Support") slot = "easy";
    else if (!/run|threshold|interval|aerobic/i.test(day.title)) continue;

    const main = (day.session?.main ?? []).join("|");
    out.push({
      slot,
      sessionId: day.template_id ?? day.title,
      sessionName: day.title,
      fingerprint: `${day.title.trim().toLowerCase()}::${main.toLowerCase().replace(/\s+/g, " ")}`,
      day: day.day,
    });
  }
  return out;
}

export function isBannedRunPick(
  session: SessionTemplate,
  ctx: RunProgressionContext,
  appliedTitle?: string
): boolean {
  const fp = sessionFingerprint(session);
  const name = (appliedTitle ?? session.name).trim().toLowerCase();

  const prev = ctx.previousWeekSnapshots ?? [];
  const same = ctx.sameWeekSnapshots ?? [];

  for (const snap of prev) {
    if (snap.slot !== ctx.slot) continue;

    if (
      ctx.assignedDay &&
      snap.day === ctx.assignedDay &&
      (snap.sessionName.trim().toLowerCase() === name || snap.fingerprint === fp)
    ) {
      return true;
    }

    if (snap.fingerprint === fp || snap.sessionName.trim().toLowerCase() === name) {
      return true;
    }
    if (ctx.slot === "threshold" && snap.slot === "threshold" && snap.sessionName === session.name) {
      return true;
    }
  }

  for (const snap of same) {
    if (snap.slot === ctx.slot && snap.fingerprint === fp) return true;
    if (snap.sessionId === session.id) return true;
  }

  return false;
}

/** Apply progression family prescription to a picked template. */
export function applyRunProgressionPrescription(
  session: SessionTemplate,
  ctx: RunProgressionContext,
  input: { ability_level: AbilityLevel; has_injury?: boolean },
  applied?: AppliedProgression | null
): { session: SessionTemplate; applied: AppliedProgression | null } {
  const prog = applied ?? resolveRunAppliedProgression(ctx, input);
  if (!prog) {
    return { session, applied: null };
  }

  const clone: SessionTemplate = JSON.parse(JSON.stringify(session));
  clone.name = prog.variant.title;
  if (prog.variant.main.length > 0) {
    clone.prescription.main = [...prog.variant.main];
  }
  clone.prescription.notes = [
    ...(clone.prescription.notes ?? []),
    prog.variant.coach_snippet,
    `Week focus: ${prog.variant.progression_focus}`,
  ];

  return { session: clone, applied: prog };
}

export function runSlotForRole(
  role: string,
  runQualityPickIndex: number
): RunProgressionSlot | null {
  if (role === "run_quality" || role === "run_quality_beginner") {
    return runQualityPickIndex === 0 ? "threshold" : "interval";
  }
  if (role === "run_long") return "long";
  if (role === "run_aerobic") return "easy";
  return null;
}

export type { AppliedProgression };
