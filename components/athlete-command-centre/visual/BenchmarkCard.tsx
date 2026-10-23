import { PerformanceMetric } from "./PerformanceMetric";
import type { AthleteStatusKey } from "./tokens";

export function BenchmarkCard({
  label,
  value,
  derived,
  status,
  meta,
  empty,
}: {
  label: string;
  value: string | null | undefined;
  derived?: string | null;
  status: AthleteStatusKey;
  meta?: string | null;
  empty?: string;
}) {
  return (
    <PerformanceMetric
      label={label}
      value={value}
      derived={derived}
      status={status}
      meta={meta}
      empty={empty ?? "No result for this test yet."}
    />
  );
}
