/**
 * Structured coach instructions for Week Composer.
 * Free text is stored for coach reference; structured fields drive the engine.
 * Light keyword helpers exist for convenience — not claimed as NL intelligence.
 */

import type {
  WeekComposerInstruction,
  WeekComposerStructuredInstruction,
  WeekComposerWeekday,
} from "@/app/lib/hyroxWeekComposerTypes";

const DAYS: WeekComposerWeekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_ALIASES: Record<string, WeekComposerWeekday> = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thur: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
  sat: "Sat",
  saturday: "Sat",
  sun: "Sun",
  sunday: "Sun",
};

function emptyStructured(): WeekComposerStructuredInstruction {
  return {
    runVolumeKmMin: null,
    runVolumeKmMax: null,
    longRunMinutes: null,
    keepSessionIds: [],
    keepDays: [],
    progressSessionIds: [],
    progressDays: [],
    reduceSessionIds: [],
    reduceDays: [],
    restDays: [],
    movePairs: [],
    notes: null,
  };
}

export function createWeekComposerInstruction(
  freeText = "",
  structured?: Partial<WeekComposerStructuredInstruction>
): WeekComposerInstruction {
  return {
    freeText: freeText.trim(),
    structured: { ...emptyStructured(), ...structured },
  };
}

/** Parse simple patterns from free text into structured fields (best-effort, not AI). */
export function extractStructuredHintsFromFreeText(
  freeText: string
): Partial<WeekComposerStructuredInstruction> {
  const text = freeText.toLowerCase();
  const out: Partial<WeekComposerStructuredInstruction> = {};

  const vol = text.match(/(\d+)\s*[–\-]\s*(\d+)\s*km/);
  if (vol) {
    out.runVolumeKmMin = Number(vol[1]);
    out.runVolumeKmMax = Number(vol[2]);
  } else {
    const single = text.match(/(\d+)\s*km/);
    if (single && /volume|target|aim/.test(text)) {
      const n = Number(single[1]);
      out.runVolumeKmMin = n;
      out.runVolumeKmMax = n;
    }
  }

  const longRun = text.match(/long\s*run[^\d]*(\d+)\s*min/);
  if (longRun) out.longRunMinutes = Number(longRun[1]);

  const progressDays: WeekComposerWeekday[] = [];
  const reduceDays: WeekComposerWeekday[] = [];
  const keepDays: WeekComposerWeekday[] = [];
  const restDays: WeekComposerWeekday[] = [];

  for (const [alias, day] of Object.entries(DAY_ALIASES)) {
    const dayRe = new RegExp(`\\b${alias}\\b[^.]{0,40}`);
    const window = text.match(dayRe)?.[0] ?? "";
    if (!window) continue;
    if (/progress|advance|push/.test(window)) progressDays.push(day);
    if (/reduce|easier|deload|cut/.test(window)) reduceDays.push(day);
    if (/keep|same|preserve/.test(window)) keepDays.push(day);
    if (/rest|no intensity|recovery only/.test(window)) restDays.push(day);
  }

  if (progressDays.length) out.progressDays = [...new Set(progressDays)];
  if (reduceDays.length) out.reduceDays = [...new Set(reduceDays)];
  if (keepDays.length) out.keepDays = [...new Set(keepDays)];
  if (restDays.length) out.restDays = [...new Set(restDays)];

  return out;
}

export function mergeInstructionWithFreeTextHints(
  instruction: WeekComposerInstruction
): WeekComposerInstruction {
  const hints = extractStructuredHintsFromFreeText(instruction.freeText);
  const s = instruction.structured;
  return {
    freeText: instruction.freeText,
    structured: {
      ...s,
      runVolumeKmMin: s.runVolumeKmMin ?? hints.runVolumeKmMin ?? null,
      runVolumeKmMax: s.runVolumeKmMax ?? hints.runVolumeKmMax ?? null,
      longRunMinutes: s.longRunMinutes ?? hints.longRunMinutes ?? null,
      progressDays: uniqueDays([...(s.progressDays ?? []), ...(hints.progressDays ?? [])]),
      reduceDays: uniqueDays([...(s.reduceDays ?? []), ...(hints.reduceDays ?? [])]),
      keepDays: uniqueDays([...(s.keepDays ?? []), ...(hints.keepDays ?? [])]),
      restDays: uniqueDays([...(s.restDays ?? []), ...(hints.restDays ?? [])]),
    },
  };
}

function uniqueDays(days: WeekComposerWeekday[]): WeekComposerWeekday[] {
  return DAYS.filter((d) => days.includes(d));
}

export function instructionForcesProgress(
  instruction: WeekComposerInstruction,
  day: WeekComposerWeekday,
  sessionId: string
): boolean {
  const s = instruction.structured;
  return (
    (s.progressDays ?? []).includes(day) || (s.progressSessionIds ?? []).includes(sessionId)
  );
}

export function instructionForcesReduce(
  instruction: WeekComposerInstruction,
  day: WeekComposerWeekday,
  sessionId: string
): boolean {
  const s = instruction.structured;
  return (s.reduceDays ?? []).includes(day) || (s.reduceSessionIds ?? []).includes(sessionId);
}

export function instructionForcesKeep(
  instruction: WeekComposerInstruction,
  day: WeekComposerWeekday,
  sessionId: string
): boolean {
  const s = instruction.structured;
  return (s.keepDays ?? []).includes(day) || (s.keepSessionIds ?? []).includes(sessionId);
}

export function instructionRestDay(
  instruction: WeekComposerInstruction,
  day: WeekComposerWeekday
): boolean {
  return (instruction.structured.restDays ?? []).includes(day);
}

export function instructionMoveForSession(
  instruction: WeekComposerInstruction,
  day: WeekComposerWeekday,
  sessionId: string
): WeekComposerWeekday | null {
  for (const pair of instruction.structured.movePairs ?? []) {
    if (pair.fromDay !== day) continue;
    if (pair.sessionId && pair.sessionId !== sessionId) continue;
    return pair.toDay;
  }
  return null;
}
