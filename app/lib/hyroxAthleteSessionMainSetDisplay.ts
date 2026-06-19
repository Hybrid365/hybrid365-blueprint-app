import type { CoachSessionEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import { deriveMainSetLinesFromEditConfig } from "@/app/lib/hyroxCoachProgrammeDraft";
import {
  buildCompromisedMainSetLines,
} from "@/app/lib/hyroxSessionTargetOverrides";

export type AthleteSessionMainSetBlock = {
  title: string;
  lines: string[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

function isSeparatorLine(line: string): boolean {
  const t = line.trim();
  return t === "—" || t === "---" || t === "–";
}

export function hasMultiPartMainSetMarkers(lines: string[]): boolean {
  return lines.some((l) => /^Part\s+\d+/i.test(l.trim()));
}

/** Pick the richest athlete-facing main set from published prescription + editConfig. */
export function resolveAthleteMainSetLines(
  edit: CoachSessionEditConfig,
  prescription: Record<string, unknown>
): string[] {
  const manual = asStringArray(edit.mainSetLines);
  const prescriptionMain = asStringArray(prescription.mainSet);
  const derived = deriveMainSetLinesFromEditConfig(edit);
  const hasCompromisedStructure =
    edit.kind === "compromised" ||
    Boolean((edit.runDistanceM || edit.rounds) && (edit.reps || edit.station || edit.stationDetail));
  const compromisedBuilt = hasCompromisedStructure
    ? buildCompromisedMainSetLines({ ...edit, kind: "compromised" })
    : [];

  if (manual.length > 0) return manual;

  if (prescriptionMain.length > 0 && hasMultiPartMainSetMarkers(prescriptionMain)) {
    if (!derived.length || prescriptionMain.length >= derived.length) {
      return prescriptionMain;
    }
  }

  if (compromisedBuilt.length > 0) {
    if (prescriptionMain.length > compromisedBuilt.length && hasMultiPartMainSetMarkers(prescriptionMain)) {
      return prescriptionMain;
    }
    if (compromisedBuilt.length >= derived.length) return compromisedBuilt;
  }

  if (derived.length > 0) {
    if (prescriptionMain.length > derived.length) return prescriptionMain;
    return derived;
  }

  if (prescriptionMain.length > 0) return prescriptionMain;

  const keySetSummary = prescription.keySetSummary;
  if (typeof keySetSummary === "string" && keySetSummary.trim()) {
    return [keySetSummary.trim()];
  }

  if (typeof edit.exercises === "string" && edit.exercises.trim()) {
    return edit.exercises
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  return [];
}

const PART_HEADER_RE = /^Part\s+(\d+(?:\.\d+)?)\s*[:\-—]\s*(.*)$/i;

/** Split main-set lines into labelled blocks when Part 1 / Part 2 markers are present. */
export function parseMainSetBlocks(lines: string[]): AthleteSessionMainSetBlock[] | null {
  const cleaned = lines.filter((l) => !isSeparatorLine(l));
  if (cleaned.length < 2 || !hasMultiPartMainSetMarkers(cleaned)) return null;

  const partStarts = cleaned
    .map((line, index) => (PART_HEADER_RE.test(line.trim()) ? index : -1))
    .filter((i) => i >= 0);

  if (partStarts.length < 2) return null;

  const blocks: AthleteSessionMainSetBlock[] = [];

  for (let p = 0; p < partStarts.length; p++) {
    const start = partStarts[p]!;
    const end = p + 1 < partStarts.length ? partStarts[p + 1]! : cleaned.length;
    const chunk = cleaned.slice(start, end);
    const first = chunk[0]?.trim() ?? "";
    const match = first.match(PART_HEADER_RE);

    if (match) {
      const partNum = match[1] ?? "";
      const inline = match[2]?.trim() ?? "";
      const bodyLines = chunk.slice(1);
      const blob = `${inline} ${bodyLines.join(" ")}`.toLowerCase();
      const title =
        partNum === "2" && /station|750m|600m|run →|wall ball|overload/.test(blob)
          ? `Part ${partNum} — Station overload`
          : partNum === "1"
            ? `Part ${partNum} — Fast running`
            : `Part ${partNum}`;
      const linesForBlock = [...(inline ? [inline] : []), ...bodyLines];
      blocks.push({ title, lines: linesForBlock });
    } else {
      blocks.push({ title: first, lines: chunk.slice(1) });
    }
  }

  return blocks.length >= 2 ? blocks : null;
}

export function resolveStationFocus(
  edit: CoachSessionEditConfig,
  coachNote: string
): string | undefined {
  const station = edit.station?.trim();
  const detail = edit.stationDetail?.trim();
  if (station && detail && station !== detail) {
    return `${station} — ${detail}`;
  }
  if (station) return station;
  if (detail) return detail;
  if (/weakness|station of choice|weakest station/i.test(coachNote)) {
    return "Use your weakest Hyrox station (wall ball, lunges, BBJ, sled, carry, ski/row, etc.).";
  }
  return undefined;
}

export function resolveFullPrescriptionText(
  prescription: Record<string, unknown>,
  edit: CoachSessionEditConfig,
  mainSet: string[]
): string | undefined {
  const candidates = [
    prescription.fullPrescription,
    prescription.prescriptionText,
    prescription.rawPrescription,
    prescription.details,
    prescription.content,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  for (const text of candidates) {
    const trimmed = text.trim();
    const mainBlob = mainSet.join("\n").toLowerCase();
    if (!mainBlob.includes(trimmed.slice(0, 40).toLowerCase())) {
      return trimmed;
    }
  }

  if (edit.kind === "strength_endurance" && edit.exercises?.trim()) {
    const ex = edit.exercises.trim();
    if (!mainSet.some((l) => l.includes(ex.slice(0, 24)))) return ex;
  }

  return undefined;
}
