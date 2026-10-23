import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";
import {
  PRESCRIPTION_BASES,
  type PrescriptionAdjustment,
  type PrescriptionBasis,
  type PrescriptionCoachOverride,
  type PrescriptionRule,
  type PrescriptionSnapshot,
  type ResolveHyroxPrescriptionInput,
} from "@/app/lib/hyroxPrescriptionTypes";

export class PrescriptionEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrescriptionEngineError";
  }
}

const BASIS_LABEL: Record<PrescriptionBasis, string> = {
  run_5k_pace: "@5K",
  threshold_pace: "@THRESHOLD",
  hyrox_run_pace: "@HYROX",
  ski_2k_split: "@2K_SKIERG",
  row_2k_split: "@2K_ROW",
  ftp_watts: "@FTP",
};

const BASIS_UNIT: Record<PrescriptionBasis, string> = {
  run_5k_pace: "s/km",
  threshold_pace: "s/km",
  hyrox_run_pace: "s/km",
  ski_2k_split: "s/500m",
  row_2k_split: "s/500m",
  ftp_watts: "W",
};

const SECONDS_PER_KM_BASES = new Set<PrescriptionBasis>([
  "run_5k_pace",
  "threshold_pace",
  "hyrox_run_pace",
]);

const SECONDS_PER_500M_BASES = new Set<PrescriptionBasis>(["ski_2k_split", "row_2k_split"]);

function isPrescriptionBasis(value: string): value is PrescriptionBasis {
  return (PRESCRIPTION_BASES as readonly string[]).includes(value);
}

function assertFiniteNumber(value: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PrescriptionEngineError(`${label} must be a finite number.`);
  }
  return value;
}

function assertLegalPair(basis: PrescriptionBasis, adjustment: PrescriptionAdjustment): void {
  switch (adjustment.type) {
    case "seconds_per_km":
      if (!SECONDS_PER_KM_BASES.has(basis)) {
        throw new PrescriptionEngineError(
          `Illegal prescription: seconds_per_km cannot apply to ${basis}.`
        );
      }
      return;
    case "seconds_per_500m":
      if (!SECONDS_PER_500M_BASES.has(basis)) {
        throw new PrescriptionEngineError(
          `Illegal prescription: seconds_per_500m cannot apply to ${basis}.`
        );
      }
      return;
    case "percent":
      if (basis !== "ftp_watts") {
        throw new PrescriptionEngineError(`Illegal prescription: percent cannot apply to ${basis}.`);
      }
      return;
    case "identity":
      return;
    default: {
      const neverType: never = adjustment;
      throw new PrescriptionEngineError(
        `Illegal prescription: unknown adjustment ${(neverType as PrescriptionAdjustment).type}.`
      );
    }
  }
}

export function assertLegalPrescriptionRule(rule: PrescriptionRule): void {
  if (!rule || !isPrescriptionBasis(rule.basis)) {
    throw new PrescriptionEngineError("Illegal prescription: unknown basis.");
  }
  const adjustment = rule.adjustment;
  if (!adjustment || typeof adjustment !== "object" || typeof adjustment.type !== "string") {
    throw new PrescriptionEngineError("Illegal prescription: missing adjustment.");
  }
  if (
    adjustment.type === "seconds_per_km" ||
    adjustment.type === "seconds_per_500m" ||
    adjustment.type === "percent"
  ) {
    assertFiniteNumber(adjustment.value, "Adjustment value");
  } else if (adjustment.type !== "identity") {
    throw new PrescriptionEngineError(`Illegal prescription: unknown adjustment ${String((adjustment as { type: string }).type)}.`);
  }
  assertLegalPair(rule.basis, adjustment);
}

function formatSignedOffset(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

export function formatPrescriptionExpression(rule: PrescriptionRule): string {
  assertLegalPrescriptionRule(rule);
  const label = BASIS_LABEL[rule.basis];
  const adjustment = rule.adjustment;
  if (adjustment.type === "identity") return label;
  if (adjustment.type === "percent") return `${label} ${adjustment.value}%`;
  if (adjustment.type === "seconds_per_km") {
    return `${label} ${formatSignedOffset(adjustment.value)}s/km`;
  }
  return `${label} ${formatSignedOffset(adjustment.value)}s/500m`;
}

function readAnchor(
  basis: PrescriptionBasis,
  profile: HyroxAthletePerformanceProfile
): number | null {
  switch (basis) {
    case "run_5k_pace":
      return profile.run5k?.paceSecondsPerKm ?? null;
    case "threshold_pace":
      return profile.threshold?.paceSecondsPerKm ?? null;
    case "hyrox_run_pace":
      return profile.hyroxRun?.paceSecondsPerKm ?? null;
    case "ski_2k_split":
      return profile.ski2k?.splitSecondsPer500 ?? null;
    case "row_2k_split":
      return profile.row2k?.splitSecondsPer500 ?? null;
    case "ftp_watts":
      return profile.ftp?.watts ?? null;
    default: {
      const neverBasis: never = basis;
      throw new PrescriptionEngineError(`Illegal prescription: unknown basis ${neverBasis}.`);
    }
  }
}

function ruleOffset(adjustment: PrescriptionAdjustment): number | null {
  if (adjustment.type === "seconds_per_km" || adjustment.type === "seconds_per_500m") {
    return adjustment.value;
  }
  return null;
}

function resolveFromFormula(rule: PrescriptionRule, anchor: number): number {
  const adjustment = rule.adjustment;
  if (adjustment.type === "identity") return anchor;
  if (adjustment.type === "percent") {
    return Math.round(anchor * (adjustment.value / 100));
  }
  return anchor + adjustment.value;
}

function resolveOverride(override: PrescriptionCoachOverride): { value: number; unit: string } {
  return {
    value: assertFiniteNumber(override.value, "Coach override"),
    unit: override.unit,
  };
}

export function resolveHyroxPrescription({
  rule,
  profile,
  override,
  resolvedAt,
}: ResolveHyroxPrescriptionInput): PrescriptionSnapshot {
  assertLegalPrescriptionRule(rule);
  if (typeof resolvedAt !== "string" || resolvedAt.length === 0) {
    throw new PrescriptionEngineError("resolvedAt is required.");
  }

  const expression = formatPrescriptionExpression(rule);
  const anchorValue = readAnchor(rule.basis, profile);
  const missingAnchor = anchorValue == null;
  const offset = ruleOffset(rule.adjustment);

  if (override) {
    const typed = resolveOverride(override);
    return {
      rule,
      expression,
      anchorType: rule.basis,
      anchorValue,
      anchorUnit: missingAnchor ? null : BASIS_UNIT[rule.basis],
      offset,
      resolvedValue: typed.value,
      resolvedUnit: typed.unit,
      resolvedAt,
      source: "coach_override",
      missingAnchor,
    };
  }

  if (missingAnchor) {
    return {
      rule,
      expression,
      anchorType: rule.basis,
      anchorValue: null,
      anchorUnit: null,
      offset,
      resolvedValue: null,
      resolvedUnit: null,
      resolvedAt,
      source: "formula",
      missingAnchor: true,
    };
  }

  return {
    rule,
    expression,
    anchorType: rule.basis,
    anchorValue,
    anchorUnit: BASIS_UNIT[rule.basis],
    offset,
    resolvedValue: resolveFromFormula(rule, anchorValue),
    resolvedUnit: BASIS_UNIT[rule.basis],
    resolvedAt,
    source: "formula",
    missingAnchor: false,
  };
}
