import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import type { HyroxJson, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";
import { formatProgrammeDayLabel } from "@/app/lib/hyroxAthleteProgrammeSort";
import type { ProgrammeTimeOfDay } from "@/app/lib/hyroxAthleteProgrammeSort";
import { resolveAthleteSessionDisplayName } from "@/app/lib/hyroxProgrammeSessionSync";
import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import { deriveMainSetLinesFromEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  formatAthleteTargetPaceLoad,
  hasManualPaceLoadOverrides,
  resolveAthleteHrZone,
  resolveAthleteRpeTarget,
} from "@/app/lib/hyroxSessionTargetOverrides";

export type AthleteSessionDetailContent = {
  title: string;
  objective: string;
  targetPaceLoad: string;
  warmUp: string[];
  mainSet: string[];
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

/** Resolve athlete-facing session detail from a published DB row. */
export function resolveAthleteSessionDetailFromPublishedRow(
  row: HyroxProgrammeSessionRow
): AthleteSessionDetailContent {
  const prescription = (row.prescription ?? {}) as PrescriptionLike;
  const meta = (row.metadata ?? {}) as PrescriptionLike;
  const cfg = editConfigFromPrescription(row.prescription);
  const edit = cfgAsEditConfig(cfg);

  const title = resolveAthleteSessionDisplayName(row);
  const derivedMain = deriveMainSetLinesFromEditConfig(edit);

  const overrideObjective =
    (typeof cfg.objective === "string" && cfg.objective.trim()) ||
    (derivedMain.length ? title : "") ||
    (typeof prescription.objective === "string" && prescription.objective.trim()) ||
    "";
  const overrideWarmUp = asStringArray(cfg.warmUpLines).length
    ? asStringArray(cfg.warmUpLines)
    : asStringArray(prescription.warmup ?? prescription.warmUp);
  const overrideMainSet = (() => {
    if (derivedMain.length) return derivedMain;
    if (asStringArray(prescription.mainSet).length) return asStringArray(prescription.mainSet);
    if (typeof prescription.keySetSummary === "string" && prescription.keySetSummary.trim()) {
      return [prescription.keySetSummary.trim()];
    }
    return [];
  })();
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

  const coachNote =
    (typeof cfg.coachNote === "string" && cfg.coachNote.trim()) ||
    (typeof prescription.coachNote === "string" && prescription.coachNote) ||
    "";

  const whatToRecord = asStringArray(cfg.whatToRecord).length
    ? asStringArray(cfg.whatToRecord)
    : asStringArray(prescription.whatToRecord);

  return {
    title,
    objective: overrideObjective || title,
    targetPaceLoad,
    warmUp: overrideWarmUp.length ? overrideWarmUp : ["Prepare as prescribed in main set"],
    mainSet: overrideMainSet.length ? overrideMainSet : [title],
    coolDown: overrideCoolDown.length ? overrideCoolDown : ["Easy flush 5–10 min"],
    coachNote:
      coachNote ||
      "Complete at prescribed RPE. Log honestly so your coach can adjust the week.",
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
    return {
      sessionId: session.id,
      weekLabel,
      categoryTag: session.focus || session.type,
      objective: d.objective,
      durationMin: d.durationMin,
      rpeTarget: d.rpe,
      hrZone: d.hrZone,
      targetPaceLoad: d.targetPaceLoad,
      tags: [session.type, session.focus].filter(Boolean),
      warmUp: d.warmUp,
      mainSet: d.mainSet,
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
    coachNote: session.coachNote || "Complete at prescribed RPE.",
    recordFields: ["Session RPE", "Duration", "Notes"],
  };
}

export function sessionDetailFromHyroxSession(session: HyroxSession): SessionDetail {
  return resolveAthleteSessionDetailContent(session);
}
