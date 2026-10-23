import type { HyroxAthletePerformanceProfile } from "@/app/lib/hyroxBenchmarkProfile";

export const PRESCRIPTION_BASES = [
  "run_5k_pace",
  "threshold_pace",
  "hyrox_run_pace",
  "ski_2k_split",
  "row_2k_split",
  "ftp_watts",
] as const;

export type PrescriptionBasis = (typeof PRESCRIPTION_BASES)[number];

export type PrescriptionAdjustment =
  | { type: "seconds_per_km"; value: number }
  | { type: "seconds_per_500m"; value: number }
  | { type: "percent"; value: number }
  | { type: "identity" };

export type PrescriptionRule = {
  basis: PrescriptionBasis;
  adjustment: PrescriptionAdjustment;
};

export type PrescriptionCoachOverride = {
  value: number;
  unit: string;
};

export type PrescriptionSnapshot = {
  rule: PrescriptionRule;
  expression: string;
  anchorType: string;
  anchorValue: number | null;
  anchorUnit: string | null;
  offset: number | null;
  resolvedValue: number | null;
  resolvedUnit: string | null;
  resolvedAt: string;
  source: "formula" | "coach_override";
  missingAnchor: boolean;
};

export type ResolveHyroxPrescriptionInput = {
  rule: PrescriptionRule;
  profile: HyroxAthletePerformanceProfile;
  override?: PrescriptionCoachOverride;
  resolvedAt: string;
};
