/**
 * Programme blueprint parse / validate / remap / diff — pure domain.
 * No DB. No publish. Coach Copilot will eventually emit this shape.
 */

import {
  countCoachDraftSessions,
  parseCoachDraftWeekJson,
  type CoachDraftDay,
  type CoachDraftSession,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";
import { isPublishedDraftRow } from "@/app/lib/hyroxProgrammeDraftRevision";
import type {
  BlueprintImportPreview,
  BlueprintWeekDiff,
  BlueprintWeekDiffSession,
  ProgrammeBlueprintDocument,
} from "@/app/lib/hyroxProgrammeBlueprintTypes";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function sessionSource(
  session: CoachDraftSession
): BlueprintWeekDiffSession["source"] {
  if (session.sessionFamily?.familyId) return "session_family";
  if (session.coachLibraryId) return "coach_library";
  if (session.editConfig?.kind === "generic" || session.sessionId === "coach_custom_scratch") {
    return "composed";
  }
  return "unknown";
}

export function summarizeSession(session: CoachDraftSession): BlueprintWeekDiffSession {
  return {
    day: "",
    title: session.title,
    key: Boolean(session.isKeySession),
    familyId: session.sessionFamily?.familyId ?? null,
    coachLibraryId: session.coachLibraryId ?? null,
    source: sessionSource(session),
  };
}

function sessionKey(day: string, session: CoachDraftSession): string {
  return [
    day,
    session.timeOfDay,
    session.title,
    session.sessionFamily?.familyId ?? "",
    session.sessionFamily?.stageKey ?? "",
    session.coachLibraryId ?? "",
  ].join("|");
}

function sessionFingerprint(session: CoachDraftSession): string {
  return JSON.stringify({
    title: session.title,
    timeOfDay: session.timeOfDay,
    duration: session.duration,
    familyId: session.sessionFamily?.familyId ?? null,
    stageKey: session.sessionFamily?.stageKey ?? null,
    coachLibraryId: session.coachLibraryId ?? null,
    editKind: session.editConfig?.kind ?? null,
    structured:
      session.sessionFamily?.structuredWorkout ??
      session.editConfig?.structuredWorkout ??
      null,
  });
}

export type BlueprintParseResult =
  | { ok: true; blueprint: ProgrammeBlueprintDocument }
  | { ok: false; error: string };

/**
 * Accept either a ProgrammeBlueprintDocument or the Charlie offline wrapper
 * `{ meta, weeks, coachNote, ... }`.
 */
export function parseProgrammeBlueprintDocument(raw: unknown): BlueprintParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Blueprint must be a JSON object." };
  }
  const o = raw as Record<string, unknown>;

  let id = typeof o.id === "string" ? o.id.trim() : "";
  let name = typeof o.name === "string" ? o.name.trim() : "";
  let version = typeof o.version === "string" ? o.version.trim() : "";
  let weeksRaw = o.weeks;
  let coachNote = typeof o.coachNote === "string" ? o.coachNote : undefined;
  let athleteFacingNote =
    typeof o.athleteFacingNote === "string" ? o.athleteFacingNote : undefined;
  let changeSummary = Array.isArray(o.changeSummary)
    ? o.changeSummary.filter((x): x is string => typeof x === "string")
    : undefined;
  let revisesId =
    typeof o.revisesId === "string" || o.revisesId === null ? (o.revisesId as string | null) : undefined;
  let meta = o.meta && typeof o.meta === "object" && !Array.isArray(o.meta)
    ? (o.meta as Record<string, unknown>)
    : undefined;

  // Offline Charlie wrapper
  if ((!id || !weeksRaw) && Array.isArray(o.weeks)) {
    weeksRaw = o.weeks;
    const m = meta ?? (o.meta as Record<string, unknown> | undefined);
    id = id || (typeof m?.blueprintId === "string" ? m.blueprintId : "imported-blueprint");
    name = name || (typeof m?.athleteName === "string"
      ? `${m.athleteName} programme blueprint`
      : "Imported programme blueprint");
    version = version || (typeof m?.version === "string" ? m.version : "1");
  }

  if (!id) return { ok: false, error: "Blueprint id is required." };
  if (!name) return { ok: false, error: "Blueprint name is required." };
  if (!version) return { ok: false, error: "Blueprint version is required." };
  if (!Array.isArray(weeksRaw) || weeksRaw.length !== 4) {
    return { ok: false, error: "Blueprint must include exactly 4 weeks." };
  }

  const weeks: CoachDraftWeek[] = [];
  for (let i = 0; i < weeksRaw.length; i++) {
    const parsed = parseCoachDraftWeekJson(weeksRaw[i]);
    if (!parsed) {
      return { ok: false, error: `Week ${i + 1} is not a valid CoachDraftWeek.` };
    }
    if (!Array.isArray(parsed.days) || parsed.days.length !== 7) {
      return { ok: false, error: `Week ${i + 1} must have 7 days (Mon–Sun).` };
    }
    for (const day of parsed.days) {
      if (!WEEKDAYS.includes(day.day as (typeof WEEKDAYS)[number])) {
        return { ok: false, error: `Week ${i + 1} has invalid day "${String(day.day)}".` };
      }
      if (!Array.isArray(day.sessions)) {
        return { ok: false, error: `Week ${i + 1} ${day.day} sessions must be an array.` };
      }
      for (const sess of day.sessions) {
        if (!sess || typeof sess !== "object") {
          return { ok: false, error: `Week ${i + 1} ${day.day} has an invalid session.` };
        }
        if (!sess.title || typeof sess.title !== "string") {
          return { ok: false, error: `Week ${i + 1} ${day.day} session missing title.` };
        }
        if (!sess.editConfig || typeof sess.editConfig !== "object") {
          return {
            ok: false,
            error: `Week ${i + 1} ${day.day} “${sess.title}” missing editConfig (not Programme Builder editable).`,
          };
        }
      }
    }
    weeks.push(parsed);
  }

  return {
    ok: true,
    blueprint: {
      id,
      name,
      version,
      weeks,
      coachNote,
      athleteFacingNote,
      meta,
      changeSummary,
      revisesId: revisesId ?? null,
    },
  };
}

export function remapBlueprintWeekToAthleteBlock(args: {
  week: CoachDraftWeek;
  athleteId: string;
  targetBlock: number;
  cycle: 1 | 2 | 3 | 4;
}): CoachDraftWeek {
  const globalWeek = globalWeekForBlock(args.targetBlock, args.cycle);
  return {
    ...structuredClone(args.week),
    athleteId: args.athleteId,
    block: args.targetBlock,
    week: globalWeek,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Strip blueprint-carried resolved prescription values unless they are explicit
 * coach overrides. Prevents inventing / carrying another athlete's resolved paces
 * into the destination draft. StructuredWorkout structure is preserved.
 */
export function sanitizeBlueprintWeekForImport(week: CoachDraftWeek): CoachDraftWeek {
  const clone = structuredClone(week);
  for (const day of clone.days) {
    for (const session of day.sessions) {
      const family = session.sessionFamily;
      if (!family?.prescriptionPreview?.slots) continue;
      family.prescriptionPreview = {
        ...family.prescriptionPreview,
        slots: family.prescriptionPreview.slots.map((slot) => {
          if (slot.source === "coach_override" && slot.resolvedValue != null) {
            return slot;
          }
          return {
            ...slot,
            resolvedValue: null,
            resolvedUnit: null,
            anchorLabel: null,
            anchorValue: null,
            missingAnchor: true,
            publishable: false,
            publishBlockReason: "Anchor not resolved for destination athlete",
            source: "formula" as const,
          };
        }),
        resolvedAt: new Date().toISOString(),
      };
      // Clear editConfig pace fields that may have been baked from another athlete
      if (session.editConfig && typeof session.editConfig === "object") {
        const cfg = session.editConfig as Record<string, unknown>;
        if ("targetPace" in cfg) cfg.targetPace = undefined;
        if ("targetPaceLoad" in cfg && typeof cfg.targetPaceLoad === "string") {
          // Keep load notes that are not pace strings; clear /km pace copies
          if (String(cfg.targetPaceLoad).includes("/km")) cfg.targetPaceLoad = undefined;
        }
      }
    }
  }
  return clone;
}

export function countSessionsInWeek(week: CoachDraftWeek | null | undefined): number {
  if (!week) return 0;
  return countCoachDraftSessions(week).total;
}

function titlesByDay(week: CoachDraftWeek): Map<string, CoachDraftSession[]> {
  const map = new Map<string, CoachDraftSession[]>();
  for (const day of week.days) {
    map.set(day.day, day.sessions ?? []);
  }
  return map;
}

export function diffBlueprintAgainstExisting(args: {
  blueprintWeek: CoachDraftWeek;
  existing: HyroxProgrammeDraftRow | null;
  cycle: 1 | 2 | 3 | 4;
  globalWeek: number;
  publishedWeekNumbers: Set<number>;
}): BlueprintWeekDiff {
  const existingData = args.existing
    ? parseCoachDraftWeekJson(args.existing.draft_data)
    : null;
  const existingCount = countSessionsInWeek(existingData);
  const blueprintCount = countSessionsInWeek(args.blueprintWeek);
  const published =
    args.publishedWeekNumbers.has(args.globalWeek) ||
    Boolean(args.existing && isPublishedDraftRow(args.existing));

  const hasUnpublishedContent =
    Boolean(args.existing) &&
    !isPublishedDraftRow(args.existing) &&
    existingCount > 0;

  let conflict: BlueprintWeekDiff["conflict"] = "none";
  if (published && !args.existing) {
    // published week without working draft still blocks blind import into that week
    conflict = "published_snapshot";
  } else if (published && args.existing && isPublishedDraftRow(args.existing) && existingCount > 0) {
    conflict = "published_snapshot";
  } else if (published && hasUnpublishedContent) {
    // working revision exists alongside published — treat as unpublished content conflict
    conflict = "unpublished_content";
  } else if (hasUnpublishedContent) {
    conflict = "unpublished_content";
  } else if (published) {
    conflict = "published_snapshot";
  }

  const added: BlueprintWeekDiffSession[] = [];
  const removed: BlueprintWeekDiffSession[] = [];
  const changed: Array<{ day: string; from: string; to: string }> = [];
  let unchangedCount = 0;

  const bp = titlesByDay(args.blueprintWeek);
  const ex = titlesByDay(
    existingData ??
      ({
        athleteId: "",
        block: args.blueprintWeek.block,
        week: args.globalWeek,
        generatedAt: "",
        days: WEEKDAYS.map(
          (day) =>
            ({
              day,
              role: "rest",
              roleLabel: day,
              title: day,
              sessionType: "rest",
              intensity: "",
              duration: "",
              rpeHr: "",
              isKeySession: false,
              hardDay: false,
              hardEasyLabel: "Easy",
              thresholdMinutes: 0,
              qualityRunMinutes: 0,
              plannedMinutes: 0,
              rationale: "",
              sessions: [],
              optionalAddOn: null,
              emom: null,
              stationFocus: null,
              equipment: [],
              sessionId: null,
              prescription: null,
              sessionDetail: null,
            }) satisfies CoachDraftDay
        ),
      } as CoachDraftWeek)
  );

  for (const day of WEEKDAYS) {
    const bpSessions = bp.get(day) ?? [];
    const exSessions = ex.get(day) ?? [];
    const exKeys = new Map(exSessions.map((s) => [sessionKey(day, s), s]));
    const bpKeys = new Map(bpSessions.map((s) => [sessionKey(day, s), s]));

    for (const [key, sess] of bpKeys) {
      const prior = exKeys.get(key);
      if (!prior) {
        added.push({ ...summarizeSession(sess), day });
      } else if (sessionFingerprint(prior) !== sessionFingerprint(sess)) {
        changed.push({ day, from: prior.title, to: sess.title });
      } else {
        unchangedCount += 1;
      }
    }
    for (const [key, sess] of exKeys) {
      if (!bpKeys.has(key)) {
        removed.push({ ...summarizeSession(sess), day });
      }
    }
  }

  return {
    cycle: args.cycle,
    globalWeek: args.globalWeek,
    blueprintSessionCount: blueprintCount,
    existingSessionCount: existingCount,
    existingDraftId: args.existing?.id ?? null,
    existingDbStatus: args.existing?.status ?? null,
    existingCoachStatus: args.existing ? draftDbToCoachStatus(args.existing.status) : null,
    existingPublished: published,
    hasUnpublishedContent,
    conflict,
    added,
    removed,
    changed,
    unchangedCount,
  };
}

export function buildBlueprintImportPreview(args: {
  athleteId: string;
  targetBlock: number;
  blueprint: ProgrammeBlueprintDocument;
  existingByGlobalWeek: Map<number, HyroxProgrammeDraftRow | null>;
  publishedWeekNumbers: Set<number>;
}): BlueprintImportPreview {
  const weeks: BlueprintWeekDiff[] = [];
  for (let cycle = 1 as 1 | 2 | 3 | 4; cycle <= 4; cycle = (cycle + 1) as 1 | 2 | 3 | 4) {
    const globalWeek = globalWeekForBlock(args.targetBlock, cycle);
    const remapped = remapBlueprintWeekToAthleteBlock({
      week: args.blueprint.weeks[cycle - 1]!,
      athleteId: args.athleteId,
      targetBlock: args.targetBlock,
      cycle,
    });
    weeks.push(
      diffBlueprintAgainstExisting({
        blueprintWeek: remapped,
        existing: args.existingByGlobalWeek.get(globalWeek) ?? null,
        cycle,
        globalWeek,
        publishedWeekNumbers: args.publishedWeekNumbers,
      })
    );
  }

  const blockedByPublished = weeks.some((w) => w.conflict === "published_snapshot");
  const requiresReplaceConfirmation = weeks.some((w) => w.conflict === "unpublished_content");
  const canApplyWithoutReplace =
    !blockedByPublished && !requiresReplaceConfirmation;

  let summary: string;
  if (blockedByPublished) {
    summary =
      "Import blocked: one or more target weeks are published. Choose another block or create a draft revision workflow separately — v1 import never mutates published snapshots.";
  } else if (requiresReplaceConfirmation) {
    summary =
      "Target block has existing unpublished draft content. Cancel, choose another block, or confirm replace of the listed unpublished weeks.";
  } else {
    summary = "Target weeks are empty or shell-only. Import can proceed without replacing coach edits.";
  }

  return {
    athleteId: args.athleteId,
    targetBlock: args.targetBlock,
    blueprint: {
      id: args.blueprint.id,
      name: args.blueprint.name,
      version: args.blueprint.version,
      changeSummary: args.blueprint.changeSummary,
      revisesId: args.blueprint.revisesId,
    },
    weeks,
    canApplyWithoutReplace,
    requiresReplaceConfirmation,
    blockedByPublished,
    summary,
  };
}
