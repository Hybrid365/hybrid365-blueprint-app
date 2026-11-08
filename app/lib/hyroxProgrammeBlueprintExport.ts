/**
 * Programme blueprint export — pure domain.
 * Builds / parses export documents. No DB. No writes.
 */

import {
  countCoachDraftSessions,
  parseCoachDraftWeekJson,
  type CoachDraftWeek,
} from "@/app/lib/hyroxCoachProgrammeDraft";
import { draftDbToCoachStatus } from "@/app/lib/hyroxCoachProgrammeStatusMap";
import type { HyroxProgrammeDraftRow } from "@/app/lib/hyroxDatabaseTypes";
import {
  isPublishedDraftRow,
  isUnpublishedWorkingDraft,
} from "@/app/lib/hyroxProgrammeDraftRevision";
import { parseProgrammeBlueprintDocument } from "@/app/lib/hyroxProgrammeBlueprint";
import type {
  ProgrammeBlueprintDocument,
  ProgrammeBlueprintExportDocument,
  ProgrammeBlueprintExportProvenance,
  ProgrammeBlueprintExportSelection,
  ProgrammeBlueprintExportWeekProvenance,
} from "@/app/lib/hyroxProgrammeBlueprintTypes";
import { globalWeekForBlock } from "@/app/lib/hyroxCoachProgrammeDraft";
import { cycleInBlockForGlobalWeek } from "@/app/lib/hyroxProgrammeDates";

export const PROGRAMME_BLUEPRINT_EXPORT_FORMAT = "hybrid365.programme_blueprint_export" as const;
export const PROGRAMME_BLUEPRINT_EXPORT_FORMAT_VERSION = "1" as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Opaque stable ref — not reversible to UUID without the original id. Portable (no node:crypto). */
export function athleteRefFromId(athleteId: string): string {
  const input = `hybrid365:athlete:${athleteId}`;
  // FNV-1a 64-bit style mix → hex (stable, non-PII)
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = BigInt.asUintN(64, h * 0x100000001b3n);
  }
  return `ath_${h.toString(16).padStart(16, "0")}`;
}

export function sanitizeWeekForExport(
  week: CoachDraftWeek,
  athleteRef: string
): CoachDraftWeek {
  return {
    ...structuredClone(week),
    athleteId: athleteRef,
  };
}

export function resolveExportGlobalWeeks(args: {
  block: number;
  selection: ProgrammeBlueprintExportSelection;
  globalWeeks?: number[];
}): number[] {
  const blockWeeks = ([1, 2, 3, 4] as const).map((c) => globalWeekForBlock(args.block, c));
  if (args.selection === "entire_block") return [...blockWeeks];

  const requested = [...new Set(args.globalWeeks ?? [])].sort((a, b) => a - b);
  if (requested.length === 0) {
    throw new Error("global_weeks is required for current_week / selected_weeks.");
  }
  for (const w of requested) {
    if (!blockWeeks.includes(w)) {
      throw new Error(
        `global week ${w} is outside Block ${args.block} (${blockWeeks.join(", ")}).`
      );
    }
  }
  if (args.selection === "current_week" && requested.length !== 1) {
    throw new Error("current_week selection requires exactly one global_weeks entry.");
  }
  return requested;
}

function classifyContentSource(
  row: HyroxProgrammeDraftRow | null
): ProgrammeBlueprintExportWeekProvenance["contentSource"] {
  if (!row) return "missing";
  if (isUnpublishedWorkingDraft(row)) return "unpublished_working_draft";
  if (isPublishedDraftRow(row)) return "published_snapshot";
  return "missing";
}

export function buildWeekProvenance(args: {
  block: number;
  globalWeek: number;
  preferredRow: HyroxProgrammeDraftRow | null;
  athleteWeekPublished: boolean;
}): ProgrammeBlueprintExportWeekProvenance {
  const cycle = cycleInBlockForGlobalWeek(args.globalWeek);
  const row = args.preferredRow;
  const draftData = row ? parseCoachDraftWeekJson(row.draft_data) : null;
  const sessionCount = draftData ? countCoachDraftSessions(draftData) : 0;
  const contentSource = classifyContentSource(row);

  return {
    cycle,
    globalWeek: args.globalWeek,
    draftId: row?.id ?? null,
    dbStatus: row?.status ?? null,
    coachStatus: row ? draftDbToCoachStatus(row.status) : null,
    athleteWeekPublished: args.athleteWeekPublished,
    contentSource,
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
    publishedAt: row?.published_at ?? null,
    sessionCount,
  };
}

export function buildProgrammeBlueprintExportDocument(args: {
  athleteId: string;
  athleteLabel?: string | null;
  block: number;
  selection: ProgrammeBlueprintExportSelection;
  selectedGlobalWeeks: number[];
  preferredByWeek: Map<number, HyroxProgrammeDraftRow | null>;
  publishedWeekNumbers: Set<number>;
  exportedAt?: string;
}): ProgrammeBlueprintExportDocument {
  const athleteRef = athleteRefFromId(args.athleteId);
  const exportedAt = args.exportedAt ?? new Date().toISOString();
  const weekProvenance: ProgrammeBlueprintExportWeekProvenance[] = [];
  const weeks: CoachDraftWeek[] = [];

  for (const globalWeek of args.selectedGlobalWeeks) {
    const row = args.preferredByWeek.get(globalWeek) ?? null;
    const athleteWeekPublished =
      args.publishedWeekNumbers.has(globalWeek) || Boolean(row && isPublishedDraftRow(row));
    const provenance = buildWeekProvenance({
      block: args.block,
      globalWeek,
      preferredRow: row,
      athleteWeekPublished,
    });
    weekProvenance.push(provenance);

    if (provenance.contentSource === "missing" || !row) continue;
    const parsed = parseCoachDraftWeekJson(row.draft_data);
    if (!parsed) continue;
    weeks.push(sanitizeWeekForExport(parsed, athleteRef));
  }

  const label = args.athleteLabel?.trim() || null;
  const selectionLabel =
    args.selection === "entire_block"
      ? `Block ${args.block}`
      : `W${args.selectedGlobalWeeks.join(",")}`;

  const provenance: ProgrammeBlueprintExportProvenance = {
    exportedAt,
    athleteRef,
    athleteLabel: label,
    sourceBlock: args.block,
    selection: args.selection,
    selectedGlobalWeeks: [...args.selectedGlobalWeeks],
    weekProvenance,
  };

  return {
    format: PROGRAMME_BLUEPRINT_EXPORT_FORMAT,
    formatVersion: PROGRAMME_BLUEPRINT_EXPORT_FORMAT_VERSION,
    id: `export-${athleteRef}-b${args.block}-${args.selectedGlobalWeeks.join("-")}`,
    name: label
      ? `${label} — ${selectionLabel} export`
      : `Programme export — ${selectionLabel}`,
    version: "1.0.0",
    weeks,
    export: provenance,
    meta: {
      purpose: "coach_programme_export",
      importCompatibleWhenFourWeeks: weeks.length === 4,
      note: "Provenance lives under export.*; weeks[] are full CoachDraftWeek payloads.",
    },
  };
}

export function suggestedExportFilename(doc: ProgrammeBlueprintExportDocument): string {
  const weeks = doc.export.selectedGlobalWeeks.join("-");
  const stamp = doc.export.exportedAt.slice(0, 10);
  return `hybrid365-programme-export-b${doc.export.sourceBlock}-w${weeks}-${stamp}.json`;
}

export type ExportParseResult =
  | { ok: true; document: ProgrammeBlueprintExportDocument }
  | { ok: false; error: string };

/**
 * Parse an export document (1–4 weeks). Validates CoachDraftWeek structure.
 */
export function parseProgrammeBlueprintExportDocument(raw: unknown): ExportParseResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Export must be a JSON object." };
  }
  const o = raw as Record<string, unknown>;
  if (o.format !== PROGRAMME_BLUEPRINT_EXPORT_FORMAT) {
    return {
      ok: false,
      error: `Expected format "${PROGRAMME_BLUEPRINT_EXPORT_FORMAT}".`,
    };
  }
  if (o.formatVersion !== PROGRAMME_BLUEPRINT_EXPORT_FORMAT_VERSION) {
    return { ok: false, error: `Unsupported formatVersion "${String(o.formatVersion)}".` };
  }
  if (typeof o.id !== "string" || !o.id.trim()) {
    return { ok: false, error: "Export id is required." };
  }
  if (typeof o.name !== "string" || !o.name.trim()) {
    return { ok: false, error: "Export name is required." };
  }
  if (typeof o.version !== "string" || !o.version.trim()) {
    return { ok: false, error: "Export version is required." };
  }
  if (!Array.isArray(o.weeks) || o.weeks.length < 1 || o.weeks.length > 4) {
    return { ok: false, error: "Export weeks must be an array of length 1–4." };
  }
  if (!o.export || typeof o.export !== "object" || Array.isArray(o.export)) {
    return { ok: false, error: "Export provenance (export) is required." };
  }

  const weeks: CoachDraftWeek[] = [];
  for (let i = 0; i < o.weeks.length; i++) {
    const parsed = parseCoachDraftWeekJson(o.weeks[i]);
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
      for (const sess of day.sessions ?? []) {
        if (!sess?.title || !sess.editConfig) {
          return {
            ok: false,
            error: `Week ${i + 1} ${day.day} session missing title or editConfig.`,
          };
        }
      }
    }
    weeks.push(parsed);
  }

  const exp = o.export as ProgrammeBlueprintExportProvenance;
  if (!exp.athleteRef || !Array.isArray(exp.selectedGlobalWeeks) || !Array.isArray(exp.weekProvenance)) {
    return { ok: false, error: "Export provenance is incomplete." };
  }

  return {
    ok: true,
    document: {
      format: PROGRAMME_BLUEPRINT_EXPORT_FORMAT,
      formatVersion: PROGRAMME_BLUEPRINT_EXPORT_FORMAT_VERSION,
      id: o.id.trim(),
      name: o.name.trim(),
      version: o.version.trim(),
      weeks,
      coachNote: typeof o.coachNote === "string" ? o.coachNote : undefined,
      athleteFacingNote:
        typeof o.athleteFacingNote === "string" ? o.athleteFacingNote : undefined,
      export: exp,
      meta:
        o.meta && typeof o.meta === "object" && !Array.isArray(o.meta)
          ? (o.meta as Record<string, unknown>)
          : undefined,
    },
  };
}

/**
 * Unwrap a 4-week export into the import blueprint validator.
 * Partial exports cannot be imported as a block without padding — returns error.
 */
export function exportDocumentToImportBlueprint(
  doc: ProgrammeBlueprintExportDocument
): { ok: true; blueprint: ProgrammeBlueprintDocument } | { ok: false; error: string } {
  if (doc.weeks.length !== 4) {
    return {
      ok: false,
      error: `Import-compatible unwrap requires exactly 4 weeks (got ${doc.weeks.length}). Use entire_block export or analyse partial weeks via parseProgrammeBlueprintExportDocument.`,
    };
  }
  const raw = {
    id: doc.id,
    name: doc.name,
    version: doc.version,
    weeks: doc.weeks,
    coachNote: doc.coachNote,
    athleteFacingNote: doc.athleteFacingNote,
    meta: {
      ...(doc.meta ?? {}),
      fromExport: true,
      exportProvenance: doc.export,
    },
  };
  const parsed = parseProgrammeBlueprintDocument(raw);
  if (!parsed.ok) return parsed;
  return { ok: true, blueprint: parsed.blueprint };
}

/** Deterministic read-only unwrap: returns weeks for analysis regardless of length. */
export function unwrapExportWeeks(raw: unknown): {
  ok: true;
  weeks: CoachDraftWeek[];
  provenance: ProgrammeBlueprintExportProvenance;
} | { ok: false; error: string } {
  const parsed = parseProgrammeBlueprintExportDocument(raw);
  if (!parsed.ok) return parsed;
  return {
    ok: true,
    weeks: parsed.document.weeks,
    provenance: parsed.document.export,
  };
}
