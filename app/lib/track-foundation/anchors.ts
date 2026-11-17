import { computePaceGuidanceFromFiveKSeconds } from "@/app/lib/paceGuidance";
import { formatClock, formatDisplayDate, formatPacePer500, parseClockToSeconds } from "./dates";
import type { EvidenceBook } from "./evidence";
import { SOURCE_LABEL, runningThresholdSpecificity, FTP_FROM_20_MIN_FACTOR, ERG_THRESHOLD_OFFSET_SEC } from "./policies";
import { getTest } from "./testLibrary";
import type {
  AnchorProvenance,
  AnchorStatus,
  ClassifiedEvidence,
  FamilyResolution,
  HyroxRaceProfile,
  RunningAnchorSet,
  StationMetricKey,
  TrainingAnchor,
} from "./types";

function statusOf(family: FamilyResolution, row: ClassifiedEvidence | null): AnchorStatus {
  if (!row) return "unavailable";
  if (family.anchorStatus === "reassessment_due") return "reassessment_due";
  if (family.current?.id === row.id || family.contenders.some((item) => item.id === row.id)) {
    return family.anchorStatus === "active" ? "active" : family.anchorStatus;
  }
  return "unavailable";
}

function provenance(row: ClassifiedEvidence, statement: string): AnchorProvenance {
  const test = getTest(row.testId);
  return {
    resultId: row.id,
    testId: row.testId,
    testName: test?.name ?? row.testId,
    result: row.resultValue,
    unit: row.unit,
    date: row.date,
    source: row.source,
    statement,
  };
}

function makeAnchor(args: {
  key: string;
  domain: TrainingAnchor["domain"];
  label: string;
  display: string;
  status: AnchorStatus;
  precision: TrainingAnchor["precision"];
  row: ClassifiedEvidence;
  statement: string;
}): TrainingAnchor {
  return {
    key: args.key,
    domain: args.domain,
    label: args.label,
    display: args.display,
    status: args.status,
    precision: args.precision,
    provenance: provenance(args.row, args.statement),
    reassessmentDue: args.status === "reassessment_due",
  };
}

function bestThresholdRow(family: FamilyResolution): ClassifiedEvidence | null {
  const rows = family.contenders.filter((row) =>
    ["run_lab_threshold", "run_threshold", "run_5k", "run_10k"].includes(row.testId)
  );
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => {
    const score = (row: ClassifiedEvidence) => row.sourceRank * 10 + runningThresholdSpecificity(row.testId);
    const delta = score(b) - score(a);
    if (delta !== 0) return delta;
    return (a.ageDays ?? 9999) - (b.ageDays ?? 9999);
  })[0]!;
}

function bestByTest(family: FamilyResolution, testIds: string[]): ClassifiedEvidence | null {
  const rows = family.contenders.filter((row) => testIds.includes(row.testId));
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => b.sourceRank - a.sourceRank || (a.ageDays ?? 9999) - (b.ageDays ?? 9999))[0]!;
}

function quoted(row: ClassifiedEvidence): string {
  const test = getTest(row.testId);
  return `${test?.name ?? "Result"} ${row.resultValue} on ${formatDisplayDate(row.date)} (${SOURCE_LABEL[row.source]})`;
}

export function deriveRunningAnchors(book: EvidenceBook): RunningAnchorSet {
  const family = book.running;
  const five = bestByTest(family, ["run_5k"]);
  const half = bestByTest(family, ["run_half"]);
  const thresholdRow = bestThresholdRow(family);
  const empty: RunningAnchorSet = { easy: null, lt1: null, threshold: null, speed: null };

  let easy: TrainingAnchor | null = null;
  let speed: TrainingAnchor | null = null;
  let threshold: TrainingAnchor | null = null;

  if (five) {
    const seconds = parseClockToSeconds(five.resultValue);
    const guidance = seconds != null ? computePaceGuidanceFromFiveKSeconds(seconds) : null;
    const state = statusOf(family, five);
    if (guidance && state !== "unavailable") {
      easy = makeAnchor({
        key: "run_easy",
        domain: "running",
        label: "Easy",
        display: guidance.zones.easy,
        status: state,
        precision: "policy_zones",
        row: five,
        statement: `Easy range came from ${quoted(five)}, using the existing 5K pace policy.`,
      });
      speed = makeAnchor({
        key: "run_speed",
        domain: "running",
        label: "5K pace",
        display: guidance.five_k_pace,
        status: state,
        precision: "policy_zones",
        row: five,
        statement: `Speed reference came from ${quoted(five)}.`,
      });
    }
  } else if (half && statusOf(family, half) !== "unavailable") {
    easy = makeAnchor({
      key: "run_easy",
      domain: "running",
      label: "Easy",
      display: "Conversational. No pace zone.",
      status: statusOf(family, half),
      precision: "guidance_only",
      row: half,
      statement: `Aerobic context came from ${quoted(half)}. A half marathon does not set threshold or speed.`,
    });
  }

  if (thresholdRow && statusOf(family, thresholdRow) !== "unavailable") {
    const state = statusOf(family, thresholdRow);
    if (thresholdRow.testId === "run_5k") {
      const seconds = parseClockToSeconds(thresholdRow.resultValue);
      const guidance = seconds != null ? computePaceGuidanceFromFiveKSeconds(seconds) : null;
      if (guidance) {
        threshold = makeAnchor({
          key: "run_threshold",
          domain: "running",
          label: "Threshold",
          display: guidance.zones.threshold,
          status: state,
          precision: "policy_zones",
          row: thresholdRow,
          statement: `Threshold target came from ${quoted(thresholdRow)}, using the existing 5K pace policy.`,
        });
      }
    } else if (thresholdRow.testId === "run_10k") {
      const seconds = parseClockToSeconds(thresholdRow.resultValue);
      if (seconds != null) {
        const base = seconds / 10;
        const fast = Math.round(base / 5) * 5;
        const slow = Math.round((base + 15) / 5) * 5;
        const fmt = (sec: number) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${m}:${String(s).padStart(2, "0")}`;
        };
        threshold = makeAnchor({
          key: "run_threshold",
          domain: "running",
          label: "Threshold",
          display: `${fmt(Math.min(fast, slow))}–${fmt(Math.max(fast, slow))}/km`,
          status: state,
          precision: "coarse_band",
          row: thresholdRow,
          statement: `Threshold band came from ${quoted(thresholdRow)}. Easy and speed zones are not invented from a 10K.`,
        });
      }
    } else {
      threshold = makeAnchor({
        key: "run_threshold",
        domain: "running",
        label: "Threshold",
        display: `${thresholdRow.resultValue}/km`,
        status: state,
        precision: "direct",
        row: thresholdRow,
        statement: `Threshold pace came from ${quoted(thresholdRow)}. It is the reported pace, not a race conversion.`,
      });
    }
  }

  return { ...empty, easy, lt1: null, threshold, speed };
}

function wattsOf(row: ClassifiedEvidence): number | null {
  const direct = row.details?.watts;
  if (typeof direct === "number" && Number.isFinite(direct)) return direct;
  const parsed = Number(String(row.resultValue).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function deriveBikeAnchor(book: EvidenceBook): TrainingAnchor | null {
  const direct = bestByTest(book.bike, ["bike_ftp"]);
  const twenty = bestByTest(book.bike, ["bike_20min"]);
  const row = direct ?? twenty;
  if (!row) return null;
  const state = statusOf(book.bike, row);
  if (state === "unavailable") return null;
  const watts = wattsOf(row);
  if (watts == null) return null;
  if (row.testId === "bike_ftp") {
    return makeAnchor({
      key: "bike_ftp",
      domain: "bike",
      label: "FTP",
      display: `${Math.round(watts)} W`,
      status: state,
      precision: "direct",
      row,
      statement: `Bike target came from ${quoted(row)}.`,
    });
  }
  const ftp = Math.round(watts * FTP_FROM_20_MIN_FACTOR);
  return makeAnchor({
    key: "bike_ftp",
    domain: "bike",
    label: "FTP",
    display: `${ftp} W`,
    status: state,
    precision: "estimated_ftp",
    row,
    statement: `FTP came from ${quoted(row)} at ${FTP_FROM_20_MIN_FACTOR} of the 20-minute average (${watts} W).`,
  });
}

function deriveErg(family: FamilyResolution, domain: "ski" | "row", distance = 2000): TrainingAnchor | null {
  const row = family.current ?? family.held;
  if (!row) return null;
  const state = statusOf(family, row);
  if (state === "unavailable") return null;
  const seconds = parseClockToSeconds(row.resultValue);
  const split = seconds != null ? formatPacePer500(seconds, distance) : null;
  const per500 = seconds != null ? seconds / (distance / 500) : null;
  const guidedLabel =
    per500 != null
      ? `${Math.floor((per500 + ERG_THRESHOLD_OFFSET_SEC) / 60)}:${String(Math.round((per500 + ERG_THRESHOLD_OFFSET_SEC) % 60)).padStart(2, "0")}/500m`
      : null;
  const clock = seconds != null ? formatClock(seconds) : row.resultValue;
  const display = [clock, split].filter(Boolean).join(" · ");
  const name = domain === "ski" ? "SkiErg" : "RowErg";
  return makeAnchor({
    key: domain === "ski" ? "ski_2k" : "row_2k",
    domain,
    label: `${name} 2K`,
    display: guidedLabel ? `${display} · threshold guide ${guidedLabel}` : display,
    status: state,
    precision: "direct",
    row,
    statement: `${name} anchor came from ${quoted(row)}. The threshold guide is ${ERG_THRESHOLD_OFFSET_SEC}s/500m slower than the 2K split. Ski and row are not mixed.`,
  });
}

export function deriveErgAnchors(book: EvidenceBook): { ski: TrainingAnchor | null; row: TrainingAnchor | null } {
  return {
    ski: deriveErg(book.ski, "ski"),
    row: deriveErg(book.row, "row"),
  };
}

const STATION_KEYS: Record<string, { key: StationMetricKey; unit: string; label: string }> = {
  sled_push: { key: "sled_push_m", unit: "m", label: "Sled push" },
  sled_pull: { key: "sled_pull_m", unit: "m", label: "Sled pull" },
  bbj: { key: "bbj_m", unit: "m", label: "Burpee broad jump" },
  lunges: { key: "lunges_m", unit: "m", label: "Lunges" },
  farmers: { key: "farmers_m", unit: "m", label: "Farmers" },
  wall_ball: { key: "wall_balls_reps", unit: "reps", label: "Wall balls" },
};

export function deriveStationAnchors(book: EvidenceBook): TrainingAnchor[] {
  const anchors: TrainingAnchor[] = [];
  for (const [familyId, meta] of Object.entries(STATION_KEYS)) {
    const family = book.stations[familyId];
    const row = family?.current ?? family?.held;
    if (!family || !row) continue;
    const state = statusOf(family, row);
    if (state === "unavailable") continue;
    anchors.push(
      makeAnchor({
        key: meta.key,
        domain: "station",
        label: meta.label,
        display: `${row.resultValue} ${meta.unit}`,
        status: state,
        precision: "direct",
        row,
        statement: `${meta.label} came from ${quoted(row)}.`,
      })
    );
  }
  return anchors;
}

export function deriveStrengthAnchor(book: EvidenceBook): TrainingAnchor | null {
  const row = book.strength.current ?? book.strength.held;
  if (!row) return null;
  const state = statusOf(book.strength, row);
  if (state === "unavailable") return null;
  const load = row.details?.load ? ` ${row.details.load}` : "";
  return makeAnchor({
    key: "strength_lower",
    domain: "strength",
    label: "Lower-body strength",
    display: `${row.resultValue} ${row.unit}${load}`,
    status: state,
    precision: "direct",
    row,
    statement: `Strength anchor came from ${quoted(row)}.`,
  });
}

export function deriveHyroxProfile(book: EvidenceBook): HyroxRaceProfile {
  const row = book.hyrox.current ?? book.hyrox.held;
  if (!row) {
    return {
      overall: null,
      division: null,
      eventName: null,
      eventDate: null,
      source: null,
      splits: {},
      observation: null,
      anchor: null,
    };
  }
  const splits = Object.fromEntries(
    Object.entries(row.details?.splits ?? {}).filter((entry) => entry[1]?.trim())
  );
  const times = Object.entries(splits)
    .map(([key, value]) => ({ key, seconds: parseClockToSeconds(value) }))
    .filter((item): item is { key: string; seconds: number } => item.seconds != null);
  const observation =
    times.length >= 4
      ? `Longest entered split is ${times.sort((a, b) => b.seconds - a.seconds)[0]!.key.replaceAll("_", " ")}. That is a description of the splits on file, not a diagnosed weakness.`
      : null;
  const state = statusOf(book.hyrox, row);
  return {
    overall: row.resultValue,
    division: row.details?.division ?? null,
    eventName: row.details?.eventName ?? null,
    eventDate: row.date,
    source: row.source,
    splits,
    observation,
    anchor: makeAnchor({
      key: "hyrox_overall",
      domain: "hyrox",
      label: "HYROX",
      display: row.resultValue,
      status: state,
      precision: "direct",
      row,
      statement: `HYROX result came from ${quoted(row)}.${Object.keys(splits).length === 0 ? " Splits were not entered and were not invented." : ""}`,
    }),
  };
}

export type AnchorBundle = {
  running: RunningAnchorSet;
  bike: TrainingAnchor | null;
  ski: TrainingAnchor | null;
  row: TrainingAnchor | null;
  strength: TrainingAnchor | null;
  stations: TrainingAnchor[];
  hyrox: HyroxRaceProfile;
  reassessmentDue: string[];
};

export function deriveAnchors(book: EvidenceBook): AnchorBundle {
  const running = deriveRunningAnchors(book);
  const bike = deriveBikeAnchor(book);
  const erg = deriveErgAnchors(book);
  const strength = deriveStrengthAnchor(book);
  const stations = deriveStationAnchors(book);
  const hyrox = deriveHyroxProfile(book);
  const all = [running.easy, running.threshold, running.speed, bike, erg.ski, erg.row, strength, hyrox.anchor, ...stations];
  const reassessmentDue = all
    .filter((anchor): anchor is TrainingAnchor => Boolean(anchor?.reassessmentDue))
    .map((anchor) => anchor.label);
  return {
    running,
    bike,
    ski: erg.ski,
    row: erg.row,
    strength,
    stations,
    hyrox,
    reassessmentDue,
  };
}

/** 5K string for the existing generator. Stale and watch-estimate results are not passed through. */
export function currentFiveKForProgramme(book: EvidenceBook): string | null {
  const row = bestByTest(book.running, ["run_5k"]);
  if (!row) return null;
  if (row.source === "watch_estimate") return null;
  if (statusOf(book.running, row) === "unavailable") return null;
  return parseClockToSeconds(row.resultValue) != null ? row.resultValue.trim() : null;
}
