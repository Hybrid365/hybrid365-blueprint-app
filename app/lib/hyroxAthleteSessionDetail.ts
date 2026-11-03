import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import type { HyroxJson, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";
import { formatProgrammeDayLabel } from "@/app/lib/hyroxAthleteProgrammeSort";
import type { ProgrammeTimeOfDay } from "@/app/lib/hyroxAthleteProgrammeSort";
import { resolveAthleteSessionDisplayName } from "@/app/lib/hyroxProgrammeSessionSync";
import { sanitizeAthleteSessionTitle } from "@/app/lib/hyroxSessionFamilyAthleteCopy";
import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  parseMainSetBlocks,
  resolveAthleteMainSetLines,
  resolveFullPrescriptionText,
  resolveStationFocus,
  type AthleteSessionMainSetBlock,
} from "@/app/lib/hyroxAthleteSessionMainSetDisplay";
import {
  formatAthleteTargetPaceLoad,
  hasManualPaceLoadOverrides,
  resolveAthleteHrZone,
  resolveAthleteRpeTarget,
} from "@/app/lib/hyroxSessionTargetOverrides";

export type { AthleteSessionMainSetBlock };

export type AthleteSessionDetailContent = {
  title: string;
  objective: string;
  targetPaceLoad: string;
  warmUp: string[];
  mainSet: string[];
  mainSetBlocks?: AthleteSessionMainSetBlock[] | null;
  stationFocus?: string;
  fullPrescription?: string;
  coolDown: string[];
  coachNote: string;
  coachPacingNote?: string;
  whatToRecord: string[];
  duration: string;
  durationMin: number;
  rpe: string;
  hrZone: string;
  filmPrompt?: string;
};

type PrescriptionLike = Record<string, unknown>;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function editConfigFromPrescription(prescription: HyroxJson | null | undefined): PrescriptionLike {
  if (!prescription || typeof prescription !== "object" || Array.isArray(prescription)) return {};
  const cfg = (prescription as PrescriptionLike).editConfig;
  return cfg && typeof cfg === "object" && !Array.isArray(cfg) ? (cfg as PrescriptionLike) : {};
}

function parseDurationMin(duration: string | undefined | null): number {
  if (!duration) return 45;
  const n = parseInt(duration, 10);
  return Number.isFinite(n) && n > 0 ? n : 45;
}

function cfgAsEditConfig(cfg: PrescriptionLike): CoachSessionEditConfig {
  return cfg as unknown as CoachSessionEditConfig;
}

function firstTrimmedString(...candidates: unknown[]): string | null {
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function objectHasAthleteFacingCoachField(obj: PrescriptionLike): boolean {
  return (
    "athleteFacingNote" in obj ||
    "athlete_facing_note" in obj ||
    "athleteFacingCoachNote" in obj
  );
}

/**
 * Athlete-visible session coach copy only.
 * Prefers explicit athlete-facing fields. Never returns internal-only notes.
 * Family publishes always blank. Legacy single `coachNote` remains athlete-facing
 * only when no athlete-facing / internal split fields are present on the same object.
 */
export function resolveAthleteFacingSessionCoachNote(params: {
  hasFamilyPublish: boolean;
  prescription?: PrescriptionLike | null;
  meta?: PrescriptionLike | null;
  editConfig?: PrescriptionLike | null;
}): string {
  if (params.hasFamilyPublish) return "";
  const prescription = params.prescription ?? {};
  const meta = params.meta ?? {};
  const cfg = params.editConfig ?? {};

  const explicitFacing = firstTrimmedString(
    cfg.athleteFacingNote,
    cfg.athleteFacingCoachNote,
    cfg.athlete_facing_note,
    prescription.athleteFacingNote,
    prescription.athleteFacingCoachNote,
    prescription.athlete_facing_note,
    meta.athleteFacingNote,
    meta.athleteFacingCoachNote,
    meta.athlete_facing_note
  );
  if (explicitFacing) return explicitFacing;

  const splitDeclared =
    objectHasAthleteFacingCoachField(cfg) ||
    objectHasAthleteFacingCoachField(prescription) ||
    objectHasAthleteFacingCoachField(meta);
  if (splitDeclared) {
    // Facing field present but empty → hide; do not fall back to internal coachNote/coach_note.
    return "";
  }

  // Legacy single coachNote on session prescription/detail is athlete-facing library copy.
  // Never read week-level coach_note here (not passed in).
  return (
    firstTrimmedString(
      cfg.coachNote,
      prescription.coachNote,
      meta.coachNote
    ) ?? ""
  );
}

/** Resolve athlete-facing session detail from a published DB row. */
export function resolveAthleteSessionDetailFromPublishedRow(
  row: HyroxProgrammeSessionRow
): AthleteSessionDetailContent {
  const prescription = (row.prescription ?? {}) as PrescriptionLike;
  const meta = (row.metadata ?? {}) as PrescriptionLike;
  const cfg = editConfigFromPrescription(row.prescription);
  const edit = cfgAsEditConfig(cfg);

  const title = resolveAthleteSessionDisplayName(row);
  const overrideMainSet = resolveAthleteMainSetLines(edit, prescription);
  const mainSetBlocks = parseMainSetBlocks(overrideMainSet);

  const overrideObjective =
    (typeof cfg.objective === "string" && cfg.objective.trim()) ||
    (overrideMainSet.length ? title : "") ||
    (typeof prescription.objective === "string" && prescription.objective.trim()) ||
    "";
  const overrideWarmUp = asStringArray(cfg.warmUpLines).length
    ? asStringArray(cfg.warmUpLines)
    : asStringArray(prescription.warmup ?? prescription.warmUp);
  const overrideCoolDown = asStringArray(cfg.coolDownLines).length
    ? asStringArray(cfg.coolDownLines)
    : asStringArray(prescription.cooldown ?? prescription.coolDown);

  const duration =
    (typeof meta.duration === "string" && meta.duration) ||
    (typeof prescription.duration === "string" && prescription.duration) ||
    "45 min";

  const rpe = resolveAthleteRpeTarget(edit, {
    rpeTarget: prescription.rpeTarget as string | undefined,
    targetRPE: prescription.targetRPE as string | undefined,
  });

  const hrZone = resolveAthleteHrZone(edit, {
    targetHRRange: prescription.targetHRRange as string | undefined,
    fallbackHRGuide: prescription.fallbackHRGuide as string | undefined,
  });

  const targetPaceLoad = formatAthleteTargetPaceLoad(edit, {
    targetPace: hasManualPaceLoadOverrides(edit) ? null : (prescription.targetPace as string | null),
    targetSplit: hasManualPaceLoadOverrides(edit) ? null : (prescription.targetSplit as string | null),
    targetLoad: hasManualPaceLoadOverrides(edit) ? null : (prescription.targetLoad as string | null),
  });

  const coachPacingNote =
    (typeof cfg.coachPacingNote === "string" && cfg.coachPacingNote.trim()) || undefined;

  const hasFamilyPublish = Boolean(
    prescription.sessionFamily &&
      typeof prescription.sessionFamily === "object" &&
      !Array.isArray(prescription.sessionFamily)
  );
  const coachNote = resolveAthleteFacingSessionCoachNote({
    hasFamilyPublish,
    prescription,
    meta,
    editConfig: cfg,
  });

  const stationFocus = resolveStationFocus(edit, coachNote);
  const fullPrescription = resolveFullPrescriptionText(prescription, edit, overrideMainSet);

  const whatToRecord = asStringArray(cfg.whatToRecord).length
    ? asStringArray(cfg.whatToRecord)
    : asStringArray(prescription.whatToRecord);

  return {
    title,
    objective: overrideObjective || title,
    targetPaceLoad,
    warmUp: overrideWarmUp.length ? overrideWarmUp : ["Prepare as prescribed in main set"],
    mainSet: overrideMainSet.length ? overrideMainSet : [title],
    mainSetBlocks,
    stationFocus,
    fullPrescription,
    coolDown: overrideCoolDown.length ? overrideCoolDown : ["Easy flush 5–10 min"],
    coachNote,
    coachPacingNote,
    whatToRecord: whatToRecord.length ? whatToRecord : ["Session RPE", "Duration", "Notes"],
    duration,
    durationMin: parseDurationMin(duration),
    rpe,
    hrZone,
    filmPrompt:
      (typeof cfg.filmPrompt === "string" && cfg.filmPrompt.trim()) ||
      (typeof prescription.filmPrompt === "string" ? prescription.filmPrompt : undefined),
  };
}

/** Map HyroxSession (with optional embedded detail) to SessionDetail for drawer. */
export function resolveAthleteSessionDetailContent(
  session: HyroxSession,
  opts?: { weekLabel?: string }
): SessionDetail {
  const d = session.detail;
  const weekLabel =
    opts?.weekLabel ?? formatProgrammeDayLabel(session.day, session.timeOfDay as ProgrammeTimeOfDay);

  if (d) {
    const displayName = (session.name || d.title || "").trim();
    const safeFocus = sanitizeAthleteSessionTitle(session.focus || session.type);
    const tags = [session.type, safeFocus]
      .map((t) => t?.trim())
      .filter((t): t is string => Boolean(t))
      .filter((t, i, arr) => arr.indexOf(t) === i)
      .filter((t) => t.toLowerCase() !== displayName.toLowerCase())
      .filter((t) => !/Stage\s*\d|·\s*S\d|familyId|stageId/i.test(t));
    return {
      sessionId: session.id,
      weekLabel,
      categoryTag: session.type || safeFocus,
      objective: d.objective,
      durationMin: d.durationMin,
      rpeTarget: d.rpe,
      hrZone: d.hrZone,
      targetPaceLoad: d.targetPaceLoad,
      tags: tags.length ? tags : [session.type].filter(Boolean),
      warmUp: d.warmUp,
      mainSet: d.mainSet,
      mainSetBlocks: d.mainSetBlocks,
      stationFocus: d.stationFocus,
      fullPrescription: d.fullPrescription,
      coolDown: d.coolDown,
      coachNote: d.coachNote,
      coachPacingNote: d.coachPacingNote,
      recordFields: d.whatToRecord,
      filmPrompt: d.filmPrompt,
    };
  }

  return {
    sessionId: session.id,
    weekLabel,
    categoryTag: session.focus || session.type,
    objective: session.intent || session.name,
    durationMin: parseDurationMin(session.duration),
    rpeTarget: session.rpeTarget,
    hrZone: "Per programme prescription",
    targetPaceLoad: session.name,
    tags: [session.type, session.focus].filter(Boolean),
    warmUp: ["Prepare as prescribed"],
    mainSet: [session.intent || session.name],
    coolDown: ["Easy flush 5–10 min"],
    coachNote: session.coachNote?.trim() || "",
    recordFields: ["Session RPE", "Duration", "Notes"],
  };
}

export function sessionDetailFromHyroxSession(session: HyroxSession): SessionDetail {
  return resolveAthleteSessionDetailContent(session);
}
