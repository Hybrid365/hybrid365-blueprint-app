import { MotionConfirm } from "./motion";
import { visualBody, visualCardQuiet, visualEyebrow, visualMeta } from "./tokens";

/**
 * Restrained completion confirmation. Shows only values the caller already has.
 * Does not invent RPE, execution, legs, energy, or actuals.
 */
export function SessionCompleteConfirm({
  rpe,
  execution,
  legs,
  energy,
  notes,
  actuals,
}: {
  rpe?: string | null;
  execution?: string | null;
  legs?: string | null;
  energy?: string | null;
  notes?: string | null;
  actuals?: Array<{ label: string; value: string }>;
}) {
  const rows = [
    rpe?.trim() ? { label: "RPE", value: rpe.trim() } : null,
    execution?.trim() ? { label: "Execution", value: execution.trim() } : null,
    legs?.trim() ? { label: "Legs", value: legs.trim() } : null,
    energy?.trim() ? { label: "Energy", value: energy.trim() } : null,
    ...(actuals ?? []).filter((row) => row.value.trim()),
  ].filter((row): row is { label: string; value: string } => Boolean(row));

  return (
    <MotionConfirm>
      <div className={`${visualCardQuiet} border-zinc-700 px-4 py-3`}>
        <p className={visualEyebrow}>Session logged</p>
        <p className={`mt-2 ${visualBody}`}>Saved. Your coach can see this result.</p>
        {rows.length ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className={visualMeta}>{row.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-200">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {notes?.trim() ? (
          <p className={`mt-3 ${visualMeta}`}>{notes.trim()}</p>
        ) : null}
      </div>
    </MotionConfirm>
  );
}
