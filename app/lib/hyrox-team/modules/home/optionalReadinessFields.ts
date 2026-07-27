import type { HyroxDailyReadinessRow } from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";

export type OptionalReadinessFields = {
  sleepDurationMinutes: number | null;
  hrv: number | null;
  recoveryNotes: string | null;
};

export function readOptionalReadinessFields(
  row: HyroxDailyReadinessRow | null | undefined
): OptionalReadinessFields {
  const j = row?.inputs_json ?? {};
  const sleepDurationMinutes =
    typeof j.sleepDurationMinutes === "number" && Number.isFinite(j.sleepDurationMinutes)
      ? j.sleepDurationMinutes
      : null;
  const hrv =
    typeof j.hrv === "number" && Number.isFinite(j.hrv) ? j.hrv : null;
  const recoveryNotes =
    typeof j.recoveryNotes === "string" && j.recoveryNotes.trim()
      ? j.recoveryNotes.trim()
      : null;
  return { sleepDurationMinutes, hrv, recoveryNotes };
}
