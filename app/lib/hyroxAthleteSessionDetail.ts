import type { HyroxSession, SessionDetail } from "@/app/lib/hyroxTeamDashboardMock";
import type { HyroxJson, HyroxProgrammeSessionRow } from "@/app/lib/hyroxDatabaseTypes";
import { formatProgrammeDayLabel } from "@/app/lib/hyroxAthleteProgrammeSort";
import type { ProgrammeTimeOfDay } from "@/app/lib/hyroxAthleteProgrammeSort";
import { resolveAthleteSessionDisplayName } from "@/app/lib/hyroxProgrammeSessionSync";

export type AthleteSessionDetailContent = {
  title: string;
  objective: string;
  targetPaceLoad: string;
  warmUp: string[];
  mainSet: string[];
  coolDown: string[];
  coachNote: string;
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

function deriveMainSetFromEditConfig(cfg: PrescriptionLike): string[] {
  const kind = typeof cfg.kind === "string" ? cfg.kind : "";
  if (kind === "erg_interval") {
    const reps = typeof cfg.ergReps === "number" ? cfg.ergReps : Number(cfg.ergReps);
    const mins =
      typeof cfg.intervalDurationMinutes === "number"
        ? cfg.intervalDurationMinutes
        : Number(cfg.intervalDurationMinutes);
    if (Number.isFinite(reps) && reps > 0 && Number.isFinite(mins) && mins > 0) {
      const mod =
        cfg.modality === "row" ? "Row" : cfg.modality === "bike" ? "Bike" : "Ski";
      const lines = [`${reps}×${mins} min ${mod} @ threshold`];
      if (typeof cfg.recovery === "string" && cfg.recovery.trim()) {
        lines.push(`Recovery: ${cfg.recovery.trim()}`);
      }
      if (typeof cfg.targetSplit === "string" && cfg.targetSplit.trim()) {
        lines.push(`Target split: ${cfg.targetSplit.trim()}`);
      }
      return lines;
    }
  }
  if (kind === "threshold_run") {
    const reps = typeof cfg.reps === "number" ? cfg.reps : Number(cfg.reps);
    const mins =
      typeof cfg.repDurationMinutes === "number" ? cfg.repDurationMinutes : Number(cfg.repDurationMinutes);
    if (Number.isFinite(reps) && reps > 0 && Number.isFinite(mins) && mins > 0) {
      const lines = [`${reps}×${mins} min @ threshold`];
      if (typeof cfg.recovery === "string" && cfg.recovery.trim()) {
        lines.push(`Recovery: ${cfg.recovery.trim()}`);
      }
      if (typeof cfg.targetPace === "string" && cfg.targetPace.trim()) {
        lines.push(`Target pace: ${cfg.targetPace.trim()}`);
      }
      return lines;
    }
  }
  if (typeof cfg.exercises === "string" && cfg.exercises.trim()) {
    return cfg.exercises.split("\n").map((l) => l.trim()).filter(Boolean);
  }
  if (Array.isArray(cfg.mainSetLines)) {
    return asStringArray(cfg.mainSetLines);
  }
  return [];
}

/** Resolve athlete-facing session detail from a published DB row. */
export function resolveAthleteSessionDetailFromPublishedRow(
  row: HyroxProgrammeSessionRow
): AthleteSessionDetailContent {
  const prescription = (row.prescription ?? {}) as PrescriptionLike;
  const meta = (row.metadata ?? {}) as PrescriptionLike;
  const cfg = editConfigFromPrescription(row.prescription);

  const title = resolveAthleteSessionDisplayName(row);
  const derivedMain = deriveMainSetFromEditConfig(cfg);

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

  const rpe =
    (typeof cfg.rpeTarget === "string" && cfg.rpeTarget.trim()) ||
    (typeof prescription.rpeTarget === "string" && prescription.rpeTarget) ||
    (typeof prescription.targetRPE === "string" && prescription.targetRPE) ||
    "7–8";

  const hrZone =
    (typeof cfg.hrZone === "string" && cfg.hrZone.trim()) ||
    (typeof cfg.hrGuide === "string" && cfg.hrGuide.trim()) ||
    (typeof prescription.targetHRRange === "string" && prescription.targetHRRange) ||
    (typeof prescription.fallbackHRGuide === "string" && prescription.fallbackHRGuide) ||
    "Per programme prescription";

  const targetPaceLoad =
    (typeof cfg.targetPaceLoad === "string" && cfg.targetPaceLoad.trim()) ||
    (typeof cfg.targetPace === "string" && cfg.targetPace.trim()) ||
    (typeof cfg.targetSplit === "string" && cfg.targetSplit.trim()) ||
    (typeof prescription.targetPace === "string" && prescription.targetPace) ||
    (typeof prescription.targetSplit === "string" && prescription.targetSplit) ||
    (typeof prescription.targetLoad === "string" && prescription.targetLoad) ||
    (overrideMainSet[0] ?? "See session prescription");

  const coachNote =
    (typeof cfg.coachNote === "string" && cfg.coachNote.trim()) ||
    (typeof prescription.coachNote === "string" && prescription.coachNote) ||
    (typeof meta.intent === "string" && meta.intent) ||
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
      rpeTarget: d.rpe.replace(/[^0-9–-]/g, "") || d.rpe,
      hrZone: d.hrZone,
      targetPaceLoad: d.targetPaceLoad,
      tags: [session.type, session.focus].filter(Boolean),
      warmUp: d.warmUp,
      mainSet: d.mainSet,
      coolDown: d.coolDown,
      coachNote: d.coachNote,
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
    rpeTarget: session.rpeTarget.replace(/[^0-9–-]/g, "") || "7",
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
